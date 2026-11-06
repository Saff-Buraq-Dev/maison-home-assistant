import com.eteks.sweethome3d.io.*;import com.eteks.sweethome3d.model.*;import com.eteks.sweethome3d.j3d.*;import java.awt.image.*;import javax.imageio.*;import java.io.*;
public class R{public static void main(String[] a)throws Exception{
 Home h=new HomeFileRecorder(9,false,null,false).readHome(a[0]);
 System.out.println("lu "+h.getFurniture().size());
 Camera c=new Camera(Float.parseFloat(a[2]),Float.parseFloat(a[3]),Float.parseFloat(a[4]),(float)Math.toRadians(Float.parseFloat(a[5])),(float)Math.toRadians(Float.parseFloat(a[6])),(float)Math.toRadians(Float.parseFloat(a[7])));
 c.setTime(System.currentTimeMillis());
 h.getEnvironment().setPhotoQuality(0);
 PhotoRenderer r=new PhotoRenderer(h,PhotoRenderer.Quality.LOW);
 BufferedImage b=new BufferedImage(Integer.parseInt(a[8]),Integer.parseInt(a[9]),BufferedImage.TYPE_INT_RGB);
 r.render(b,c,null);r.dispose();ImageIO.write(b,"png",new File(a[1]));System.out.println("ok");System.exit(0);
}}
