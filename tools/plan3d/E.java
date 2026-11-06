import com.eteks.sweethome3d.io.*;import com.eteks.sweethome3d.model.*;import com.eteks.sweethome3d.j3d.*;import javax.media.j3d.*;import java.io.*;import java.util.*;
/** Exporte un étage en 3 fichiers OBJ : murs bas, ouvertures, meubles. Murs coupés à la hauteur CUT (vue maison de poupée). */
public class E{public static void main(String[] a)throws Exception{
 Home h=new HomeFileRecorder(9,false,null,false).readHome(a[0]);float CUT=Float.parseFloat(a[2]);
 File d=new File(a[1]);d.mkdirs();
 for(Wall w:h.getWalls()){w.setHeight(CUT);}
 Object3DBranchFactory f=new Object3DBranchFactory();
 OBJWriter wr=new OBJWriter(new File(d,"walls.obj"),"",-1);
 int i=0;for(Wall w:h.getWalls()){Node n=(Node)f.createObject3D(h,w,true);wr.writeNode(n,"wall_"+(i++));}
 for(Room r:h.getRooms()){Node n=(Node)f.createObject3D(h,r,true);}
 wr.close();
 OBJWriter fl=new OBJWriter(new File(d,"floors.obj"),"",-1);i=0;
 for(Room r:h.getRooms()){r.setCeilingVisible(false);Node n=(Node)f.createObject3D(h,r,true);fl.writeNode(n,"room_"+(i++));}fl.close();
 OBJWriter op=new OBJWriter(new File(d,"open.obj"),"",-1),fu=new OBJWriter(new File(d,"furn.obj"),"",-1);i=0;
 for(HomePieceOfFurniture p:h.getFurniture()){if(p.getElevation()>=CUT)continue;Node n=(Node)f.createObject3D(h,p,true);
  ((p instanceof HomeDoorOrWindow||p.getName().toLowerCase().contains("stair"))?op:fu).writeNode(n,"p"+(i++));}
 op.close();fu.close();
 try(PrintWriter j=new PrintWriter(new File(d,"rooms.json"),"UTF-8")){j.print("[");boolean c=false;for(Room r:h.getRooms()){if(c)j.print(",");c=true;j.print("{\"name\":\""+r.getName()+"\",\"pts\":[");boolean e=false;for(float[] p:r.getPoints()){if(e)j.print(",");e=true;j.print("["+Math.round(p[0])+","+Math.round(p[1])+"]");}j.print("]}");}j.print("]");}
 System.out.println("ok");System.exit(0);
}}
