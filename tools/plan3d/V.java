import com.eteks.sweethome3d.io.*;import com.eteks.sweethome3d.model.*;import java.util.*;import java.awt.geom.*;
public class V{public static void main(String[] a)throws Exception{
 for(String f:a){Home h=new HomeFileRecorder(9,false,null,false).readHome(f);
  System.out.println("=== "+f+" murs="+h.getWalls().size()+" pieces="+h.getRooms().size()+" objets="+h.getFurniture().size());
  Map<Integer,Integer> ang=new TreeMap<>();float mx=1e9f,Mx=-1e9f,my=1e9f,My=-1e9f;
  for(Wall w:h.getWalls()){double d=Math.toDegrees(Math.atan2(w.getYEnd()-w.getYStart(),w.getXEnd()-w.getXStart()));d=((d%180)+180)%180;double e=Math.min(Math.abs(d-Math.round(d/30)*30),9);ang.merge((int)Math.round(d),1,Integer::sum);if(e>0.01)System.out.println(" ANGLE "+d);
   for(float[] p:w.getPoints()){mx=Math.min(mx,p[0]);Mx=Math.max(Mx,p[0]);my=Math.min(my,p[1]);My=Math.max(My,p[1]);}}
  System.out.println(" angles "+ang+String.format(" emprise %.0f x %.0f cm",Mx-mx,My-my));
  float sum=0;for(Room r:h.getRooms()){sum+=r.getArea();
   // angle droit sauf pan coupé
   float[][] p=r.getPoints();int bad=0;for(int i=0;i<p.length;i++){float[] A=p[i],B=p[(i+1)%p.length];double d=Math.toDegrees(Math.atan2(B[1]-A[1],B[0]-A[0]));d=((d%180)+180)%180;if(Math.abs(d-Math.round(d/30)*30)>0.3)bad++;}
   System.out.printf("  %-22s %5.1f m2 %s%n",r.getName(),r.getArea()/1e4,bad>0?"ANGLE!":"ok");}
  List<HomePieceOfFurniture> fs=h.getFurniture();
  Area ws=new Area();for(Wall w:h.getWalls()){Path2D p=new Path2D.Float();float[][] q=w.getPoints();p.moveTo(q[0][0],q[0][1]);for(int i=1;i<q.length;i++)p.lineTo(q[i][0],q[i][1]);p.closePath();ws.add(new Area(p));}
  for(HomePieceOfFurniture p:fs){if(p instanceof HomeDoorOrWindow)continue;if(p.getElevation()>=95)continue;String n=p.getName();if(n.equals("Tapis"))continue;
   Path2D q=new Path2D.Float();float[][] pts=p.getPoints();q.moveTo(pts[0][0],pts[0][1]);for(int i=1;i<4;i++)q.lineTo(pts[i][0],pts[i][1]);q.closePath();Area A=new Area(q);A.intersect(ws);Rectangle2D b=A.getBounds2D();if(!A.isEmpty()&&b.getWidth()*b.getHeight()>30)System.out.printf("  mord un mur: %s (%.0f,%.0f) %.0fx%.0f%n",n,p.getX(),p.getY(),b.getWidth(),b.getHeight());}
  for(int i=0;i<fs.size();i++)for(int j=i+1;j<fs.size();j++){HomePieceOfFurniture A=fs.get(i),B=fs.get(j);if(A.getName().equals("Tapis")||B.getName().equals("Tapis")||A instanceof HomeDoorOrWindow||B instanceof HomeDoorOrWindow)continue;
   if(A.getElevation()>=A.getHeight()+B.getElevation()||B.getElevation()>=B.getHeight()+A.getElevation()||A.getElevation()+A.getHeight()<=B.getElevation()||B.getElevation()+B.getHeight()<=A.getElevation())continue;
   Path2D p=new Path2D.Float(),q=new Path2D.Float();float[][] a1=A.getPoints(),b1=B.getPoints();p.moveTo(a1[0][0],a1[0][1]);q.moveTo(b1[0][0],b1[0][1]);for(int k=1;k<4;k++){p.lineTo(a1[k][0],a1[k][1]);q.lineTo(b1[k][0],b1[k][1]);}p.closePath();q.closePath();Area X=new Area(p);X.intersect(new Area(q));Rectangle2D c=X.getBounds2D();if(!X.isEmpty()&&c.getWidth()>3&&c.getHeight()>3)System.out.printf("  chevauche: %s / %s %.0fx%.0f%n",A.getName(),B.getName(),c.getWidth(),c.getHeight());}
 }System.exit(0);}}
