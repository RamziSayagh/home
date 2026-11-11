import Link from "next/link";
import { RoomMenu } from "./room-menu";

export default function SiteNavigation() {
  return (
      <nav className="nav" aria-label="Navigation principale">
        <div className="wrap">
          <Link className="brand" href="/#projet">MAISON 1973</Link>
          <div className="nav-items">
            <RoomMenu>
              <summary>La maison <span className="menu-chevron" aria-hidden="true" /></summary>
              <div className="menu-panel">
                <Link href="/#projet">Le projet</Link>
                <Link href="/#etage">Premier étage</Link>
                <Link href="/#pieces-etage">Pièces du premier étage</Link>
                <Link href="/#materiel-etage">Matériel du premier étage</Link>
                <Link href="/#rdc">Rez-de-chaussée</Link>
                <Link href="/#exterieur">Extérieurs</Link>
              </div>
            </RoomMenu>
            <div className="links">
              <Link href="/te">Tableau électrique</Link>
              <Link href="/achats">Achats</Link>
              <Link href="/baie">Baie réseau</Link>
              <Link href="/3d">Maison en 3D</Link>
            </div>
          </div>
        </div>
      </nav>
  );
}
