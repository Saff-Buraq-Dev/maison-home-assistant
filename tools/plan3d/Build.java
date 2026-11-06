import com.eteks.sweethome3d.io.*;
import com.eteks.sweethome3d.model.*;
import com.eteks.sweethome3d.tools.*;
import java.io.*;
import java.lang.reflect.*;
import java.net.URL;
import java.util.*;

/** Reconstruit les deux plans à partir des originaux, avec l'API de Sweet Home 3D. */
public class Build {
  static final float H = 250;
  static final float EXT = 25, INT = 12;
  static final int PAINT = 0xF4F1EA, TOP = 0x2A2E3A;
  static Map<String, CatalogPieceOfFurniture> cat = new HashMap<>();
  static Map<String, float[]> texSize = new HashMap<>();
  static Map<String, String> texImg = new HashMap<>();
  static String sh3t;
  Home h;
  Home donor; // fournit la porte « Classic door » au RDC

  public static void main(String[] a) throws Exception {
    sh3t = a[0];
    // Le catalogue de la version Mac App Store attend un fournisseur « cloud » : on le neutralise.
    Class<?> itf = Class.forName("com.sm.sweethome3d.furnituremanager.base.UserCatalogImportedInterface");
    Object proxy = Proxy.newProxyInstance(itf.getClassLoader(), new Class<?>[] {itf}, (p, m, x) -> {
      if (m.getReturnType() == List.class) return new ArrayList<>();
      if (m.getReturnType() == Map.class) return new HashMap<>();
      return null;
    });
    Class.forName("com.sm.sweethome3d.furnituremanager.base.UserCatalogImportedProvider")
        .getMethod("setupInstance", itf).invoke(null, proxy);
    FurnitureCatalog c = new DefaultFurnitureCatalog((File) null);
    for (FurnitureCategory k : c.getCategories())
      for (CatalogPieceOfFurniture p : k.getFurniture()) {
        String id = p.getId() == null ? p.getName() : p.getId().substring(p.getId().indexOf('#') + 1);
        cat.put(id, p);
      }
    Properties tp = new Properties();
    try (java.util.zip.ZipFile z = new java.util.zip.ZipFile(sh3t)) {
      tp.load(z.getInputStream(z.getEntry("PluginTexturesCatalog.properties")));
    }
    for (String k : tp.stringPropertyNames())
      if (k.startsWith("id#")) {
        String n = k.substring(3), id = tp.getProperty(k);
        id = id.substring(id.indexOf('#') + 1);
        texImg.put(id, tp.getProperty("image#" + n));
        texSize.put(id, new float[] {Float.parseFloat(tp.getProperty("width#" + n)), Float.parseFloat(tp.getProperty("height#" + n))});
      }
    HomeRecorder r = new HomeFileRecorder(9, false, null, false);
    Home rdc = r.readHome(a[1]), ss = r.readHome(a[2]);
    Build b = new Build();
    b.h = ss; b.sousSol();
    b.h = rdc; b.donor = ss; b.rez();
    r.writeHome(rdc, a[3]);
    r.writeHome(ss, a[4]);
    System.out.println("ECRIT " + a[3] + " " + a[4]);
  }

  /* ---------- outils ---------- */
  HomeTexture tex(String id) throws Exception { return tex(id, 0); }
  HomeTexture tex(String id, float angle) throws Exception {
    String img = texImg.get(id);
    if (img == null) throw new RuntimeException("texture " + id);
    URL u = new File(new File(sh3t).getParent(), "x" + img).toURI().toURL();
    float[] s = texSize.get(id);
    return new HomeTexture(new CatalogTexture(id, new URLContent(u), s[0], s[1]), angle);
  }
  void clearPlan() {
    for (Wall w : new ArrayList<>(h.getWalls())) h.deleteWall(w);
    for (Room r : new ArrayList<>(h.getRooms())) h.deleteRoom(r);
  }
  Wall wall(float xs, float ys, float xe, float ye, float t) {
    Wall w = new Wall(xs, ys, xe, ye, t, H);
    w.setLeftSideColor(PAINT); w.setRightSideColor(PAINT); w.setTopColor(TOP);
    h.addWall(w);
    return w;
  }
  static void join(Wall a, boolean aEnd, Wall b, boolean bEnd) {
    if (aEnd) a.setWallAtEnd(b); else a.setWallAtStart(b);
    if (bEnd) b.setWallAtEnd(a); else b.setWallAtStart(a);
  }
  void ring(float x0, float y0, float x1, float y1) throws Exception {
    Wall n = wall(x0, y0, x1, y0, EXT), e = wall(x1, y0, x1, y1, EXT), s = wall(x1, y1, x0, y1, EXT), o = wall(x0, y1, x0, y0, EXT);
    join(n, true, e, false); join(e, true, s, false); join(s, true, o, false); join(o, true, n, false);
    for (Wall w : new Wall[] {n, e, s, o}) { w.setLeftSideColor(null); w.setLeftSideTexture(tex(extTex)); }
  }
  String extTex = "beige-bricks-wall-bricks";
  Room room(String name, String floor, float... xy) throws Exception { return room(name, floor, 0, xy); }
  Room room(String name, String floor, int angleDeg, float... xy) throws Exception {
    float[][] p = new float[xy.length / 2][2];
    for (int i = 0; i < p.length; i++) { p[i][0] = xy[2 * i]; p[i][1] = xy[2 * i + 1]; }
    Room r = new Room(p);
    r.setName(name);
    r.setFloorTexture(tex(floor, (float) Math.toRadians(angleDeg)));
    r.setCeilingColor(0xFFFFFF);
    r.setAreaVisible(false);
    h.addRoom(r);
    return r;
  }
  HomePieceOfFurniture put(String id, float x, float y, int deg) { return put(id, x, y, deg, 0); }
  HomePieceOfFurniture put(String id, float x, float y, int deg, float elev) {
    CatalogPieceOfFurniture c = cat.get(id);
    if (c == null) throw new RuntimeException("meuble " + id);
    HomePieceOfFurniture p = c instanceof DoorOrWindow ? new HomeDoorOrWindow((DoorOrWindow) c)
        : new HomePieceOfFurniture(c);
    p.setX(x); p.setY(y); p.setAngle((float) Math.toRadians(deg)); p.setElevation(elev);
    p.setName(frName(id, c.getName()));
    if (MATS.containsKey(id)) {
      Object[][] m = MATS.get(id);
      HomeMaterial[] hm = new HomeMaterial[m.length];
      for (int k = 0; k < m.length; k++) hm[k] = new HomeMaterial((String) m[k][0], 0xFF000000 | (Integer) m[k][1], null, 0.1f);
      p.setModelMaterials(hm);
    }
    h.addPieceOfFurniture(p);
    return p;
  }
  static String frName(String id, String n) { return n; }
  static final Map<String, Object[][]> MATS = new HashMap<>();
  static {
    Object[][] bed = {{"flyellow", 0x5A4030}, {"bone2", 0xE9E3D8}};
    MATS.put("bed140x190", bed); MATS.put("bed90x190", bed); MATS.put("bunkBed90x190", bed);
    MATS.put("armchair", new Object[][] {{"iris", 0x7B8C7C}});
    MATS.put("chest", new Object[][] {{"amber", 0x7A5A40}});
    MATS.put("bedsideTable", new Object[][] {{"amber", 0x7A5A40}});
    MATS.put("desk", new Object[][] {{"lighttan", 0x8A6A4C}, {"archwhite2", 0xEFEBE3}});
    MATS.put("dresser", new Object[][] {{"archwhite", 0xEFEBE3}, {"brzskin", 0x8A6A4C}});
    MATS.put("chair2", new Object[][] {{"fltan", 0xB89B78}});
    MATS.put("armchair2", new Object[][] {{"flblonde", 0x8A6A4C}});
  }
  /** Tapis ou élément plat : boîte texturable mince. */
  void rug(String tx, float x, float y, float w, float d, int deg) throws Exception {
    HomePieceOfFurniture p = put("texturableBox", x, y, deg);
    p.setWidth(w); p.setDepth(d); p.setHeight(1.2f); p.setName("Tapis");
    HomeTexture t = tex(tx);
    p.setTexture(new HomeTexture(new CatalogTexture(tx, t.getImage(), w, d)));
    p.setMovable(true);
  }
  HomePieceOfFurniture named(String name) { return named(h, name); }
  static HomePieceOfFurniture named(Home home, String name) {
    for (HomePieceOfFurniture p : home.getFurniture()) if (p.getName().equals(name)) return p;
    throw new RuntimeException("absent " + name);
  }
  /** Pose une ouverture dans un mur : le trou traverse toute l'épaisseur, l'ouverture est centrée sur l'axe du mur. */
  HomeDoorOrWindow fit(HomeDoorOrWindow d, float x, float y, int deg, float thickness, float elevation) {
    d.setAngle((float) Math.toRadians(deg));
    float wt = d.getWallThickness() > 0 ? d.getWallThickness() : 1;
    d.setDepth((thickness + 1) / wt);
    float off = (d.getWallDistance() + wt / 2 - 0.5f) * d.getDepth();
    double a = d.getAngle();
    d.setX((float) (x + off * Math.sin(a)));
    d.setY((float) (y - off * Math.cos(a)));
    d.setElevation(elevation);
    d.setBoundToWall(true);
    return d;
  }
  HomeDoorOrWindow win(String id, float x, float y, int deg, float t, float sill) {
    HomeDoorOrWindow d = (HomeDoorOrWindow) put(id, x, y, deg);
    return fit(d, x, y, deg, t, sill);
  }
  HomeDoorOrWindow win(String id, float x, float y, int deg, float t, float sill, float w, float ht) {
    HomeDoorOrWindow d = win(id, x, y, deg, t, sill);
    d.setWidth(w); d.setHeight(ht);
    return d;
  }
  /** Porte « Classic door » du plan d'origine, recopiée pour garder le même style partout. */
  HomeDoorOrWindow classic(Home from, float x, float y, int deg) {
    HomeDoorOrWindow d = (HomeDoorOrWindow) ((HomeDoorOrWindow) named(from, "Classic door")).clone();
    d.setName("Porte");
    h.addPieceOfFurniture(d);
    d.setHeight(210);
    return fit(d, x, y, deg, INT, 0);
  }
  static void place(HomePieceOfFurniture p, float x, float y, int deg) {
    p.setX(x); p.setY(y); p.setAngle((float) Math.toRadians(deg));
  }
  void env() {
    HomeEnvironment e = h.getEnvironment();
    e.setSkyColor(0xBFD9EE); e.setGroundColor(0x7F9A62); e.setLightColor(0xE8E4DC); e.setCeillingLightColor(0xE0DCD0);
    e.setWallsAlpha(0);
  }

  /* ---------- Rez-de-chaussée ---------- */
  void rez() throws Exception {
    clearPlan();
    float W = 305.25f, E = 1399.75f, N = 3.35f, S = 739.85f;       // faces intérieures d'origine
    float X0 = W - EXT / 2, X1 = E + EXT / 2, Y0 = N - EXT / 2, Y1 = S + EXT / 2;
    float i = INT / 2;
    ring(X0, Y0, X1, Y1);
    float xSalon = 640, xEntree = 829.5f, xBur = 1118.5f, xCor = 1296.5f, xSdb = 848.5f, xCh = 1018.5f;
    float yBur = 303.6f, yCor = 399.6f;
    wall(xSalon, Y0, xSalon, 260, INT);
    Wall b = wall(xEntree, Y0, xEntree, yBur, INT);
    wall(xBur, Y0, xBur, yBur, INT);
    Wall d = wall(xEntree, yBur, xCor, yBur, INT);
    Wall e = wall(xCor, yBur, xCor, yCor, INT);
    Wall f = wall(xSdb, yCor, X1, yCor, INT);
    Wall g = wall(xSdb, Y1, xSdb, yCor, INT);
    wall(xCh, yCor, xCh, Y1, INT);
    wall(X0, yCor, 383.5f, yCor, INT);
    join(b, true, d, false); join(d, true, e, false); join(g, true, f, false);

    String oak = "oak-brown-parquet", tile = "marble-floor-tiles", kit = "light-brown-tiles";
    room("Salon", oak, W, N, xSalon - i, N, xSalon - i, 260, xSalon, 260, xSalon, yCor, 383.5f, yCor, 383.5f, yCor - i, W, yCor - i);
    room("Entrée", "stoneway-floor-tiles", xSalon + i, N, xEntree - i, N, xEntree - i, 260, xSalon + i, 260);
    room("Corridor", oak, xSalon, 260, xEntree - i, 260, xEntree - i, yBur + i, xCor - i, yBur + i, xCor - i, yCor - i, xSdb, yCor - i, xSdb, yCor, xSalon, yCor);
    room("Bureau Saff", oak, xEntree + i, N, xBur - i, N, xBur - i, yBur - i, xEntree + i, yBur - i);
    room("Bureau Meriem", oak, xBur + i, N, E, N, E, yCor - i, xCor + i, yCor - i, xCor + i, yBur - i, xBur + i, yBur - i);
    room("Cuisine", kit, W, yCor + i, 383.5f, yCor + i, 383.5f, yCor, 524f, yCor, 524f, S, W, S);
    room("Salle à manger", oak, 524f, yCor, xSdb - i, yCor, xSdb - i, S, 524f, S);
    room("Salle de bain", tile, xSdb + i, yCor + i, xCh - i, yCor + i, xCh - i, S, xSdb + i, S);
    room("Chambre des maîtres", oak, xCh + i, yCor + i, E, yCor + i, E, S, xCh + i, S);

    // ouvertures existantes, recentrées dans les murs extérieurs
    fit((HomeDoorOrWindow) named("Double door with panes"), 732, Y0, 0, EXT, 0);
    fit((HomeDoorOrWindow) named("Triple French window"), 470, Y0, 180, EXT, 11);
    // portes intérieures
    classic(donor, 975, yBur, 180);
    classic(donor, xCor, 352, 90);
    classic(donor, 934, yCor, 0);
    classic(donor, 1090, yCor, 0);
    // fenêtres
    win("doubleWindow126x163", 975, Y0, 180, EXT, 75);
    win("doubleWindow126x163", 1262, Y0, 180, EXT, 75);
    win("doubleWindow126x163", X1, 195, 270, EXT, 75);
    win("doubleWindow126x163", X1, 570, 270, EXT, 75);
    win("window85x123", 1210, Y1, 0, EXT, 100, 91, 110);
    win("window85x123", 935, Y1, 0, EXT, 130, 70, 80);
    win("sliderWindow126x200", 683, Y1, 0, EXT, 0, 220, 210);
    win("doubleWindow126x123", 416, Y1, 0, EXT, 110);
    win("doubleWindow126x163", X0, 165, 90, EXT, 75);

    // cuisine : tes éléments, alignés sans chevauchement
    float kx = W + 31;
    place(named("Fridge"), kx, yCor + i + 30, 270);
    place(named("Wood lower cabinet"), kx + 1, 514, 270);
    place(named("Propane stove"), kx, 592, 270);
    HomePieceOfFurniture c2 = null;
    for (HomePieceOfFurniture p : h.getFurniture()) if (p.getName().equals("Wood lower cabinet") && p.getWidth() > 100) c2 = p;
    place(c2, kx + 1, 680, 270);
    place(named("Sink"), 416, S - 30.8f, 180);
    place(named("Wood pantry"), 514, S - 32, 180);
    place(named("Kitchen island white marble"), 442, 556, 270);
    float[] ys = {489, 556, 623};
    int si = 0;
    for (HomePieceOfFurniture p : h.getFurniture()) if (p.getName().equals("Round fabric top Stool")) place(p, 512, ys[si++], 270);
    put("hood", W + 26, 592, 270, 150);
    put("pendantLamp", 442, 489, 0, 150);
    put("pendantLamp", 442, 623, 0, 150);
    // salon
    float sx = W + 48;
    put("sofa2", sx, 165, 270);
    rug("gray-carpet", 480, 175, 300, 200, 90);
    put("coffeeTable", 475, 175, 90);
    put("armchair2", 470, 300, 0 + 0).setAngle((float) Math.toRadians(180));
    put("tvUnit", xSalon - i - 27, 175, 90);
    put("flatTV", xSalon - i - 30, 175, 90, 93);
    put("plant", W + 35, 35, 0);
    put("plant", xSalon - 40, 35, 0);
    put("floorUplight", 600, 310, 0);
    // salle à manger
    place(named("Mid-Century Wood Table"), 683, 570, 270);
    for (int k = 0; k < 3; k++) {
      put("chair2", 613, 505 + k * 65, 270);
      put("chair2", 753, 505 + k * 65, 90);
    }
    put("pendantLamp", 683, 570, 0, 145);
    put("dresser", 683, yCor + 28, 0).setWidth(150);
    rug("beige-carpet-square", 683, 570, 280, 330, 0);
    put("plant", xSdb - 40, S - 35, 0);
    // entrée
    rug("gray-medium-thick-with-squares-floor-carpeting", 732, 40, 150, 60, 0);
    put("chest", xSalon + i + 29, 170, 270);
    put("flowers", xSalon + i + 29, 170, 0, 80);
    // corridor
    rug("carpet-with-coloured-tiles", 1060, 352, 300, 70, 0);
    put("frame", 1000, yBur + i + 1, 0, 140);
    put("frame", 1100, yBur + i + 1, 0, 140);
    put("frame", 1200, yBur + i + 1, 0, 140);
    // bureau Saff
    put("desk", 975, N + 40, 0);
    put("laptop", 975, N + 40, 0, 77);
    put("chair2", 975, N + 96, 180);
    put("filledBookcase", xBur - i - 18, 150, 90);
    put("plant", xEntree + 40, N + 35, 0);
    rug("gray-medium-thick-with-squares-floor-carpeting", 975, 200, 180, 130, 0);
    // bureau Meriem
    put("desk", 1262, N + 40, 0);
    put("laptop", 1262, N + 40, 0, 77);
    put("chair2", 1262, N + 96, 180);
    put("filledBookcase", xBur + i + 18, 110, 270);
    put("armchair2", E - 55, 340, 270);
    put("plant", E - 35, N + 35, 0);
    place(named("Clothes horse"), 1241, 240, 90);
    // salle de bain
    put("fittedBath", xCh - i - 40, S - 91, 270).setWidth(180);
    put("toiletUnit", xSdb + i + 41, 620, 270);
    put("washbasinWithCabinet", xSdb + i + 30, 520, 270);
    rug("hairy-gray-floor-carpeting", 900, 590, 60, 90, 0);
    // chambre
    float bx = 1212;
    put("bed140x190", bx, S - 104, 180);
    put("bedsideTable", bx - 104, S - 20, 180);
    put("bedsideTable", bx + 104, S - 20, 180);
    put("lamp", bx - 104, S - 24, 0, 50);
    put("lamp", bx + 104, S - 24, 0, 50);
    put("wardrobe", xCh + i + 28, 560, 270).setWidth(170);
    put("dresser", 1195, yCor + i + 26, 0);
    rug("geometric-brown-carpet", bx, 500, 260, 150, 0);
    put("armchair", E - 55, 460, 270);
    put("plant", xCh + 45, yCor + 45, 0);
    env();
    h.setName(null);
  }

  /* ---------- Sous-sol ---------- */
  void sousSol() throws Exception {
    clearPlan();
    float W = 3.25f, E = 985.75f, N = 2.95f, S = 720.45f;
    float X0 = W - EXT / 2, X1 = E + EXT / 2, Y0 = N - EXT / 2, Y1 = S + EXT / 2;
    float i = INT / 2;
    extTex = "stone-bricks-stonewall";
    ring(X0, Y0, X1, Y1);
    float yMid = 412.3f, xA = 369.5f, xB = 629.9f, xD = 239.5f, yE = 341.3f, yF = 299.2f, xG = 417f, xH = 529f;
    // pan coupé à exactement 30°, qui part d'un seul nœud (xD, yE)
    float xDiag = xD + (float) ((yE - yF) / Math.tan(Math.toRadians(30)));
    Wall mid = wall(xD, yMid, X1, yMid, INT);
    wall(xA, yMid, xA, Y1, INT);
    wall(xB, yMid, xB, Y1, INT);
    Wall dw = wall(xD, yE, xD, yMid, INT);
    wall(X0, yE, xD, yE, INT);
    Wall dg = wall(xD, yE, xDiag, yF, INT);
    Wall fw = wall(xDiag, yF, xG, yF, INT);
    Wall gw = wall(xG, yF, xG, Y0, INT);
    wall(xH, Y0, xH, 239.2f, INT);
    join(dw, true, mid, false); join(dg, false, dw, false); join(dg, true, fw, false); join(fw, true, gw, false);

    // décalage de la face du pan coupé
    float t3 = 0.26795f * i, s3 = 0.57735f * i;  // décalages exacts des faces d'un mur à 30°
    String parq = "light-beige-parquet", car = "gray-medium-thick-floor-carpeting", tile = "thin-grey-ceramics-floor-tiles";
    room("Bibliothèque", parq, W, N, xG - i, N, xG - i, yF - i, xDiag - t3, yF - i, xD - t3, yE - i, W, yE - i);
    room("Chambre filles", car, W, yE + i, xD - i, yE + i, xD - i, yMid + i, xA - i, yMid + i, xA - i, S, W, S);
    room("Salle de bain bas", tile, xA + i, yMid + i, xB - i, yMid + i, xB - i, S, xA + i, S);
    room("Chambre garçons", car, xB + i, yMid + i, E, yMid + i, E, S, xB + i, S);
    room("Salle familiale", parq, xH + i, N, E, N, E, yMid - i, xD + i, yMid - i, xD + i, yE + s3, xDiag + t3, yF + i, xG + i, yF + i, xG + i, 245.2f, xH + i, 245.2f);
    room("Escalier", parq, xG + i, N, xH - i, N, xH - i, 245.2f, xG + i, 245.2f);

    // ouvertures d'origine, recalées
    List<HomePieceOfFurniture> doors = new ArrayList<>();
    for (HomePieceOfFurniture p : h.getFurniture()) if (p.getName().equals("Classic door")) doors.add(p);
    doors.sort(Comparator.comparing(HomePieceOfFurniture::getX));
    fit((HomeDoorOrWindow) doors.get(0), (xD + xDiag) / 2, (yE + yF) / 2, 150, INT, 0);
    fit((HomeDoorOrWindow) doors.get(1), 306.6f, yMid, 180, INT, 0);
    fit((HomeDoorOrWindow) doors.get(2), 476, yMid, 0, INT, 0);
    fit((HomeDoorOrWindow) doors.get(3), 742.6f, yMid, 0, INT, 0);
    for (HomePieceOfFurniture p : doors) p.setHeight(210);
    // fenêtres de sous-sol, hautes
    float sill = 135, wh = 85;
    win("doubleWindow126x123", X0, 170, 90, EXT, sill, 132, wh);
    win("doubleWindow126x123", 210, Y0, 180, EXT, sill, 132, wh);
    win("doubleWindow126x123", 900, Y0, 180, EXT, sill, 132, wh);
    win("doubleWindow126x123", X1, 80, 270, EXT, sill, 132, wh);
    win("doubleWindow126x123", X0, 530, 90, EXT, sill, 132, wh);
    win("doubleWindow126x123", 185, Y1, 0, EXT, sill, 132, wh);
    win("window85x123", 500, Y1, 0, EXT, sill, 80, wh);
    win("doubleWindow126x123", 810, Y1, 0, EXT, sill, 132, wh);
    win("doubleWindow126x123", X1, 570, 270, EXT, sill, 132, wh);

    // salle familiale : tes meubles
    HomePieceOfFurniture st = named("Straight staircase");
    st.setWidth(xH - xG - INT - 1); st.setX((xG + xH) / 2); st.setY(122);
    place(named("Corner sofa"), 745, 305, 180);
    place(named("Black TV Stand"), 748, N + 27, 0);
    place(named("TV"), 748, N + 1.5f, 0);
    place(named("Curved Fireplace"), E - 24, 230, 90);
    rug("old-carpet", 745, 190, 340, 200, 0);
    put("coffeeTable", 745, 170, 0);
    put("plant", xH + 40, N + 35, 0);
    put("plant", E - 40, 35, 0);
    put("floorUplight", xH + 20, 330, 0);
    // bibliothèque
    for (int k = 0; k < 4; k++) put("filledBookcase", 48 + k * 86, N + 19, 0);
    for (int k = 0; k < 2; k++) put("filledBookcase", W + 18, 160 + k * 86 + 40, 270);
    put("armchair2", 300, 160, 225);
    put("armchair", 190, 215, 45);
    put("bedsideTable", 272, 250, 0);
    put("lamp", 272, 250, 0, 50);
    rug("oriental-carpet", 225, 175, 230, 160, 0);
    put("plant", xG - i - 33, N + 35, 0);
    // chambre filles
    put("bed90x190", 70, S - 106, 180);
    put("bed90x190", 235, S - 106, 180);
    put("bedsideTable", 152, S - 20, 180);
    put("lamp", 152, S - 24, 0, 50);
    put("wardrobe", 72, yE + i + 28, 0).setWidth(130);
    put("desk", xA - i - 36, 490, 90);
    put("laptop", xA - i - 36, 490, 90, 77);
    put("chair2", xA - i - 92, 490, 270);
    rug("beige-carpet-square", 150, 480, 180, 120, 0);
    // salle de bain bas
    put("shower", xB - i - 42, S - 42, 0).setWidth(84);
    put("toiletUnit", xA + i + 41, 640, 270);
    put("washbasinWithCabinet", xA + i + 30, 540, 270);
    put("clothesWasher", xB - i - 34, 500, 270);
    rug("hairy-gray-floor-carpeting", 490, 610, 90, 60, 0);
    // chambre garçons
    put("bunkBed90x190", E - 66, S - 112, 180);
    put("wardrobe", xB + i + 28, 540, 270).setWidth(160);
    put("desk", 780, S - 36, 180);
    put("laptop", 780, S - 36, 180, 77);
    put("chair2", 780, S - 92, 0);
    rug("gray-carpet", 790, 520, 210, 150, 90);
    env();
    h.setName(null);
  }
}
