/* eslint-disable @next/next/no-img-element -- Preserve the original plans' intrinsic proportions. */
import { Gallery,GalleryPhoto,RoomMenu } from "./renovation-interactions";
import Link from "next/link";

const photos=[
  {
    "src": "/assets/etage/suite%201%20avant.jpg",
    "alt": "Suite 1 avant travaux"
  },
  {
    "src": "/assets/etage/suite%201%20apres.png",
    "alt": "Suite 1 après travaux"
  },
  {
    "src": "/assets/etage/suite%202%20avant.jpg",
    "alt": "Suite 2 avant travaux"
  },
  {
    "src": "/assets/etage/suite%202%20apres.png",
    "alt": "Suite 2 après travaux"
  },
  {
    "src": "/assets/etage/sdb-avant.jpg",
    "alt": "Salle de bains pendant les travaux"
  },
  {
    "src": "/assets/etage/sdb-apres.png",
    "alt": "Projection de la salle de bains rénovée"
  },
  {
    "src": "/assets/etage/enfant-avant.jpg",
    "alt": "Chambre enfant pendant les travaux"
  },
  {
    "src": "/assets/etage/enfant-apres.png",
    "alt": "Projection de la chambre enfant rénovée"
  },
  {
    "src": "/assets/etage/palier-avant.jpg",
    "alt": "Palier avant rénovation"
  },
  {
    "src": "/assets/etage/palier-projet.png",
    "alt": "Projection du palier rénové"
  },
  {
    "src": "/assets/etage/sdb-2-avant.jpg",
    "alt": "Salle d'eau du palier avant rénovation"
  },
  {
    "src": "/assets/etage/sdb-2-projet.png",
    "alt": "Projection de la salle d'eau du palier rénovée"
  },
  {
    "src": "/assets/etage/chambre-2-projet.png",
    "alt": "Projection de la deuxième chambre rénovée"
  },
  {
    "src": "/assets/rdc/entree%20avant.jpg",
    "alt": "Entrée avant travaux"
  },
  {
    "src": "/assets/rdc/entree%20apres.png",
    "alt": "Entrée après travaux"
  },
  {
    "src": "/assets/rdc/bureau%20avant.jpg",
    "alt": "Bureau avant travaux"
  },
  {
    "src": "/assets/rdc/bureau%20apres.png",
    "alt": "Bureau après travaux"
  },
  {
    "src": "/assets/rdc/chambre%20avant.jpg",
    "alt": "Chambre du rez-de-chaussée avant travaux"
  },
  {
    "src": "/assets/rdc/chambre%20apres.png",
    "alt": "Chambre du rez-de-chaussée après travaux"
  },
  {
    "src": "/assets/rdc/salle%20a%20manger%20avant.jpg",
    "alt": "Salle à manger avant travaux"
  },
  {
    "src": "/assets/rdc/salle%20a%20manger%20apres.png",
    "alt": "Salle à manger après travaux"
  },
  {
    "src": "/assets/rdc/salle%20eau%20avant.jpg",
    "alt": "Salle d'eau avant travaux"
  },
  {
    "src": "/assets/rdc/salle%20eau%20apres.png",
    "alt": "Salle d'eau après travaux"
  },
  {
    "src": "/assets/rdc/salon%20avant.jpg",
    "alt": "Salon avant travaux"
  },
  {
    "src": "/assets/rdc/salon%20apres.png",
    "alt": "Salon après travaux"
  },
  {
    "src": "/assets/rdc/cuisine%20avant.jpg",
    "alt": "Cuisine avant travaux"
  },
  {
    "src": "/assets/rdc/cuisine%20apres.png",
    "alt": "Cuisine après travaux"
  }
];

export default function Home() {
  return (
    <Gallery photos={photos}>
      <nav className="nav" aria-label="Navigation principale">
        <div className="wrap">
          <a className="brand" href="#projet">MAISON 1973</a>
          <div className="links">
            <a href="#projet">Projet</a>
            <a href="#etage">1er étage</a>
            <a href="#rdc">RDC</a>
            <a href="#exterieur">Extérieur</a>
            <Link href="/te">TE</Link>
            <Link href="/achats">Achats</Link>
            <Link href="/3d">3D</Link>
          </div>
          <RoomMenu>
            <summary>
              <span className="menu-word-desktop">Pièces</span>
              <span className="menu-word-mobile">Menu</span>
              <span aria-hidden="true">⌄</span>
            </summary>
            <div className="menu-panel">
              <div className="menu-group">
                <p>Rubriques</p>
                <a href="#projet">Le projet</a>
                <a href="#etage">Premier étage</a>
                <a href="#pieces-etage">Pièces du premier étage</a>
                <a href="#materiel-etage">Matériel du premier étage</a>
                <a href="#rdc">Rez-de-chaussée</a>
                <a href="#exterieur">Extérieurs</a>
                <Link href="/te">TE</Link>
                <Link href="/achats">Achats · Articles et matériaux</Link>
                <Link href="/3d">3D · La maison et son quartier</Link>
              </div>
              <div className="menu-group">
                <p>Pièces du premier étage</p>
                <a href="#chambre-parentale">Chambre parentale</a>
                <a href="#sdb-parentale">Salle de bains parentale</a>
                <a href="#chambre-enfant">Chambre enfant</a>
                <a href="#palier">Palier</a>
                <a href="#sdb-2">Salle d&#39;eau du palier</a>
                <a href="#chambre-2">Deuxième chambre</a>
              </div>
              <div className="menu-group">
                <p>Pièces du rez-de-chaussée</p>
                <a href="#rdc-entree">Entrée</a>
                <a href="#rdc-bureau">Bureau</a>
                <a href="#rdc-chambre">Chambre</a>
                <a href="#rdc-salle-a-manger">Salle à manger</a>
                <a href="#rdc-salle-de-bains">Salle d&#39;eau</a>
                <a href="#rdc-salon-cuisine">Salon et cuisine ouverte</a>
              </div>
            </div>
          </RoomMenu>
        </div>
      </nav>
      <header className="hero" id="projet">
        <div className="wrap">
          <div className="kicker">Rénovation complète</div>
          <h1>Une maison de 1973 repensée pour aujourd’hui.</h1>
          <div className="intro">
            <p>Rénovation complète d’une maison familiale d’environ 200 m².</p>
            <p>Le projet se déroule en trois temps : transformation du premier étage, rénovation du rez-de-chaussée, puis réaménagement des extérieurs.</p>
          </div>
          <div className="facts">
            <div className="fact">
              <b>1973</b>Construction</div>
            <div className="fact">
              <b>≈ 200 m²</b>Surface</div>
            <div className="fact">
              <b>3</b>Étapes</div>
            <div className="fact">
              <b>Val-de-Marne</b> Département</div>
          </div>
        </div>
      </header>
      <section className="stages">
        <div className="wrap">
          <div className="kicker">Le chantier</div>
          <h2>Trois étapes</h2>
          <div className="stagegrid">
            <a className="stage active" href="#etage">
              <span className="num">01</span>
              <h3>Premier étage</h3>
              <span>En cours de présentation</span>
            </a>
            <a className="stage" href="#rdc">
              <span className="num">02</span>
              <h3>Rez-de-chaussée</h3>
              <span>Plan disponible</span>
            </a>
            <a className="stage" href="#exterieur">
              <span className="num">03</span>
              <h3>Extérieurs</h3>
              <span>À venir</span>
            </a>
          </div>
        </div>
      </section>
      <section className="floor" id="etage">
        <div className="wrap">
          <div className="kicker">Étape 01</div>
          <h2>Le premier étage</h2>
          <div className="plan">
            <img src="/assets/etage/plan-etage.png" alt="Plan du premier étage" />
          </div>
          <section className="room-overview" id="pieces-etage" aria-labelledby="pieces-etage-titre">
            <h3 id="pieces-etage-titre">Les pièces du premier étage</h3>
            <div className="room-grid">
              <a className="room-card" href="#chambre-parentale">
                <span className="num">01</span>
                <h4>Chambre parentale</h4>
              </a>
              <a className="room-card" href="#sdb-parentale">
                <span className="num">02</span>
                <h4>Salle de bains parentale</h4>
              </a>
              <a className="room-card" href="#chambre-enfant">
                <span className="num">03</span>
                <h4>Chambre enfant</h4>
              </a>
              <a className="room-card" href="#palier">
                <span className="num">04</span>
                <h4>Palier</h4>
              </a>
              <a className="room-card" href="#sdb-2">
                <span className="num">05</span>
                <h4>Salle d&#39;eau du palier</h4>
              </a>
              <a className="room-card" href="#chambre-2">
                <span className="num">06</span>
                <h4>Deuxième chambre</h4>
              </a>
            </div>
          </section>
        </div>
      </section>
      <section className="project" id="chambre-parentale">
        <div className="wrap">
          <div className="project-head">
            <div>
              <div className="kicker">Suite parentale · 01</div>
              <h3>La chambre</h3>
            </div>
            <p>Une pièce entièrement reprise pour créer une suite lumineuse et chaleureuse : parquet en chevrons, menuiseries sombres, rangements intégrés et décor classique contemporain.</p>
          </div>
          <div className="surface-detail">
            <h4>Surfaces de la chambre parentale</h4>
            <p>Dimensions : 7,70 m × 3,45 m · hauteur : 2,45 m</p>
            <table>
              <thead>
                <tr>
                  <th scope="col">Surface</th>
                  <th scope="col">Calcul</th>
                  <th scope="col">Superficie</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Deux grands murs</td>
                  <td>2 × 7,70 × 2,45</td>
                  <td>37,73 m²</td>
                </tr>
                <tr>
                  <td>Deux petits murs</td>
                  <td>2 × 3,45 × 2,45</td>
                  <td>16,91 m²</td>
                </tr>
                <tr>
                  <td>Plafond</td>
                  <td>7,70 × 3,45</td>
                  <td>26,57 m²</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={2}>Total murs</th>
                  <td>54,64 m²</td>
                </tr>
                <tr>
                  <th scope="row" colSpan={2}>Total murs et plafond</th>
                  <td>81,20 m²</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <section className="work-list" aria-labelledby="travaux-chambre">
            <h4 id="travaux-chambre">Travaux restant à faire</h4>
            <ol>
              <li>Bandes à joint</li>
              <li>Enduit</li>
              <li>Moulures</li>
              <li>Peinture</li>
              <li className="owner-task">Plancher chauffant — pose réalisée par le propriétaire</li>
              <li>Chape liquide</li>
              <li>Parquet en chevrons collé</li>
            </ol>
          </section>
          <div className="compare">
            <figure className="shot">
              <GalleryPhoto index={0} />
              <span className="tag">Avant</span>
            </figure>
            <figure className="shot">
              <GalleryPhoto index={1} />
              <span className="tag">Après · suite 1</span>
            </figure>
            <figure className="shot">
              <GalleryPhoto index={2} />
              <span className="tag">Avant · suite 2</span>
            </figure>
            <figure className="shot">
              <GalleryPhoto index={3} />
              <span className="tag">Après · suite 2</span>
            </figure>
          </div>
        </div>
      </section>
      <section className="project" id="sdb-parentale">
        <div className="wrap">
          <div className="project-head">
            <div>
              <div className="kicker">Suite parentale · 02</div>
              <h3>La salle de bains</h3>
            </div>
            <p>Transformation en salle de bains généreuse avec baignoire îlot, douche double, double vasque, rangements intégrés et surfaces effet marbre.</p>
          </div>
          <div className="surface-detail">
            <h4>Surfaces de la salle de bains parentale</h4>
            <p>Dimensions : 3,15 m × 3,40 m · hauteur : 2,45 m</p>
            <table>
              <thead>
                <tr>
                  <th scope="col">Surface</th>
                  <th scope="col">Calcul</th>
                  <th scope="col">Superficie</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Deux murs de 3,15 m</td>
                  <td>2 × 3,15 × 2,45</td>
                  <td>15,44 m²</td>
                </tr>
                <tr>
                  <td>Deux murs de 3,40 m</td>
                  <td>2 × 3,40 × 2,45</td>
                  <td>16,66 m²</td>
                </tr>
                <tr>
                  <td>Plafond</td>
                  <td>3,15 × 3,40</td>
                  <td>10,71 m²</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={2}>Total murs</th>
                  <td>32,10 m²</td>
                </tr>
                <tr>
                  <th scope="row" colSpan={2}>Total murs et plafond</th>
                  <td>42,81 m²</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <section className="work-list" aria-labelledby="travaux-sdb-parentale">
            <h4 id="travaux-sdb-parentale">Travaux restant à faire</h4>
            <ol>
              <li>Bandes à joint</li>
              <li>Enduit</li>
              <li>Moulures au plafond</li>
              <li>Peinture glycéro mate du plafond</li>
              <li className="owner-task">Étanchéité liquide — à réaliser par le propriétaire</li>
              <li>Carrelage des murs</li>
              <li className="owner-task">Plancher chauffant — pose réalisée par le propriétaire</li>
              <li>Chape liquide</li>
              <li>Carrelage du sol</li>
            </ol>
          </section>
          <div className="compare">
            <figure className="shot">
              <GalleryPhoto index={4} />
              <span className="tag">Avant</span>
            </figure>
            <figure className="shot">
              <GalleryPhoto index={5} />
              <span className="tag">Projet</span>
            </figure>
          </div>
        </div>
      </section>
      <section className="project" id="chambre-enfant">
        <div className="wrap">
          <div className="project-head">
            <div>
              <div className="kicker">Premier étage · 03</div>
              <h3>Chambre enfant</h3>
            </div>
            <p>Une chambre douce et évolutive, pensée autour de la lumière naturelle : bureau sous la fenêtre, parquet en chevrons et univers végétal aux tons chaleureux.</p>
          </div>
          <div className="surface-detail">
            <h4>Surfaces de la chambre enfant</h4>
            <p>Dimensions : 4,50 m × 3,45 m · hauteur : 2,45 m</p>
            <table>
              <thead>
                <tr>
                  <th scope="col">Surface</th>
                  <th scope="col">Calcul</th>
                  <th scope="col">Superficie</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Deux murs de 4,50 m</td>
                  <td>2 × 4,50 × 2,45</td>
                  <td>22,05 m²</td>
                </tr>
                <tr>
                  <td>Deux murs de 3,45 m</td>
                  <td>2 × 3,45 × 2,45</td>
                  <td>16,91 m²</td>
                </tr>
                <tr>
                  <td>Plafond</td>
                  <td>4,50 × 3,45</td>
                  <td>15,53 m²</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={2}>Total murs</th>
                  <td>38,96 m²</td>
                </tr>
                <tr>
                  <th scope="row" colSpan={2}>Total murs et plafond</th>
                  <td>54,48 m²</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <section className="work-list" aria-labelledby="travaux-chambre-enfant">
            <h4 id="travaux-chambre-enfant">Travaux restant à faire</h4>
            <ol>
              <li>Bandes à joint</li>
              <li>Enduit</li>
              <li>Moulures au plafond seulement</li>
              <li>Peinture</li>
              <li className="owner-task">Plancher chauffant — pose réalisée par le propriétaire</li>
              <li>Chape liquide</li>
              <li>Parquet en chevrons collé</li>
              <li>Porte à poser</li>
            </ol>
            <p className="work-note">
              <strong>Attention particulière :</strong> conduit de cheminée à casser.</p>
          </section>
          <div className="compare">
            <figure className="shot">
              <GalleryPhoto index={6} />
              <span className="tag">Avant</span>
            </figure>
            <figure className="shot">
              <GalleryPhoto index={7} />
              <span className="tag">Projet</span>
            </figure>
          </div>
        </div>
      </section>
      <section className="project" id="palier">
        <div className="wrap">
          <div className="project-head">
            <div>
              <div className="kicker">Premier étage · 04</div>
              <h3>Le palier</h3>
            </div>
            <p>Un palier plus resserré, avec parquet en chevrons, moulures, trappe de plafond soignée et éclairage par spots et appliques. Le mur de droite se prolonge jusqu’au fond avec ses deux portes.</p>
          </div>
          <div className="surface-detail">
            <h4>Surfaces du palier</h4>
            <p>Dimensions : 3,00 m × 7,00 m · hauteur : 2,45 m</p>
            <table>
              <thead>
                <tr>
                  <th scope="col">Surface</th>
                  <th scope="col">Calcul</th>
                  <th scope="col">Superficie</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Deux murs de 3,00 m</td>
                  <td>2 × 3,00 × 2,45</td>
                  <td>14,70 m²</td>
                </tr>
                <tr>
                  <td>Deux murs de 7,00 m</td>
                  <td>2 × 7,00 × 2,45</td>
                  <td>34,30 m²</td>
                </tr>
                <tr>
                  <td>Plafond</td>
                  <td>3,00 × 7,00</td>
                  <td>21,00 m²</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={2}>Total murs</th>
                  <td>49,00 m²</td>
                </tr>
                <tr>
                  <th scope="row" colSpan={2}>Total murs et plafond</th>
                  <td>70,00 m²</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <section className="work-list" aria-labelledby="travaux-palier">
            <h4 id="travaux-palier">Travaux restant à faire</h4>
            <ol>
              <li>Démolition du plafond</li>
              <li>Démolition de la chape</li>
              <li>Démolition des murs</li>
              <li>Pose de fenêtre</li>
              <li>Isolation en laine de bois</li>
              <li>Pose du pare-vapeur</li>
              <li>Pose de l’ossature métallique</li>
              <li className="owner-task">Électricité — réalisée par le propriétaire</li>
              <li>Pose de plaques de plâtre</li>
              <li>Enduit</li>
              <li>Moulures</li>
              <li>Peinture</li>
              <li className="owner-task">Pose de l’isolation du sol TMS — réalisée par le propriétaire</li>
              <li className="owner-task">Plancher chauffant — pose réalisée par le propriétaire</li>
              <li>Chape liquide</li>
              <li>Carrelage du sol</li>
            </ol>
          </section>
          <div className="compare">
            <figure className="shot">
              <GalleryPhoto index={8} />
              <span className="tag">Avant</span>
            </figure>
            <figure className="shot">
              <GalleryPhoto index={9} />
              <span className="tag">Projet</span>
            </figure>
          </div>
        </div>
      </section>
      <section className="project" id="sdb-2">
        <div className="wrap">
          <div className="project-head">
            <div>
              <div className="kicker">Premier étage · 05</div>
              <h3>La salle d&#39;eau du palier</h3>
            </div>
            <p>La salle de bains existante est repensée avec un meuble vasque à droite, des toilettes suspendues à gauche et une douche derrière l’arche, sous une fenêtre anthracite à vitrage dépoli.</p>
          </div>
          <div className="surface-detail">
            <h4>Surfaces de la salle d&#39;eau du palier</h4>
            <p>Dimensions : 3,45 m × 1,80 m · hauteur : 2,45 m</p>
            <table>
              <thead>
                <tr>
                  <th scope="col">Surface</th>
                  <th scope="col">Calcul</th>
                  <th scope="col">Superficie</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Deux murs de 3,45 m</td>
                  <td>2 × 3,45 × 2,45</td>
                  <td>16,91 m²</td>
                </tr>
                <tr>
                  <td>Deux murs de 1,80 m</td>
                  <td>2 × 1,80 × 2,45</td>
                  <td>8,82 m²</td>
                </tr>
                <tr>
                  <td>Plafond</td>
                  <td>3,45 × 1,80</td>
                  <td>6,21 m²</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={2}>Total murs</th>
                  <td>25,73 m²</td>
                </tr>
                <tr>
                  <th scope="row" colSpan={2}>Total murs et plafond</th>
                  <td>31,94 m²</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <section className="work-list" aria-labelledby="travaux-sdb-2">
            <h4 id="travaux-sdb-2">Travaux restant à faire</h4>
            <ol>
              <li>Démolition du plafond</li>
              <li>Démolition de la chape</li>
              <li>Démolition des murs</li>
              <li>Pose de fenêtre</li>
              <li>Isolation en laine de bois</li>
              <li>Pose du pare-vapeur</li>
              <li>Pose de l’ossature métallique</li>
              <li className="owner-task">Électricité — réalisée par le propriétaire</li>
              <li className="owner-task">Plomberie — réalisée par le propriétaire</li>
              <li>Pose de plaques de plâtre</li>
              <li>Bandes à joint</li>
              <li>Enduit</li>
              <li>Moulures au plafond</li>
              <li>Peinture glycéro mate du plafond</li>
              <li className="owner-task">Étanchéité liquide — à réaliser par le propriétaire</li>
              <li>Carrelage des murs</li>
              <li className="owner-task">Pose de l’isolation du sol TMS — réalisée par le propriétaire</li>
              <li className="owner-task">Plancher chauffant — pose réalisée par le propriétaire</li>
              <li>Chape liquide</li>
              <li>Carrelage du sol</li>
            </ol>
          </section>
          <div className="compare">
            <figure className="shot">
              <GalleryPhoto index={10} />
              <span className="tag">Avant</span>
            </figure>
            <figure className="shot">
              <GalleryPhoto index={11} />
              <span className="tag">Projet</span>
            </figure>
          </div>
        </div>
      </section>
      <section className="project" id="chambre-2">
        <div className="wrap">
          <div className="project-head">
            <div>
              <div className="kicker">Premier étage · 06</div>
              <h3>La deuxième chambre</h3>
            </div>
            <p>Une chambre lumineuse aux murs blancs et moulures, avec parquet en chevrons et rangements intégrés.</p>
          </div>
          <div className="surface-detail">
            <h4>Surfaces de la deuxième chambre</h4>
            <p>Dimensions : 4,50 m × 3,45 m · hauteur : 2,45 m</p>
            <table>
              <thead>
                <tr>
                  <th scope="col">Surface</th>
                  <th scope="col">Calcul</th>
                  <th scope="col">Superficie</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Deux murs de 4,50 m</td>
                  <td>2 × 4,50 × 2,45</td>
                  <td>22,05 m²</td>
                </tr>
                <tr>
                  <td>Deux murs de 3,45 m</td>
                  <td>2 × 3,45 × 2,45</td>
                  <td>16,91 m²</td>
                </tr>
                <tr>
                  <td>Plafond</td>
                  <td>4,50 × 3,45</td>
                  <td>15,53 m²</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={2}>Total murs</th>
                  <td>38,96 m²</td>
                </tr>
                <tr>
                  <th scope="row" colSpan={2}>Total murs et plafond</th>
                  <td>54,48 m²</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <section className="work-list" aria-labelledby="travaux-chambre-2">
            <h4 id="travaux-chambre-2">Travaux restant à faire</h4>
            <ol>
              <li>Démolition du plafond</li>
              <li>Démolition de la chape</li>
              <li>Démolition des murs</li>
              <li>Pose de fenêtre</li>
              <li>Isolation en laine de bois</li>
              <li>Pose du pare-vapeur</li>
              <li>Pose de l’ossature métallique</li>
              <li className="owner-task">Électricité — réalisée par le propriétaire</li>
              <li>Pose de plaques de plâtre</li>
              <li>Bandes à joint</li>
              <li>Enduit</li>
              <li>Moulures</li>
              <li>Peinture</li>
              <li className="owner-task">Pose de l’isolation du sol TMS — réalisée par le propriétaire</li>
              <li className="owner-task">Plancher chauffant — pose réalisée par le propriétaire</li>
              <li>Chape liquide</li>
              <li>Parquet en chevrons collé</li>
            </ol>
          </section>
          <figure className="shot single-shot">
            <GalleryPhoto index={12} />
            <span className="tag">Projet</span>
          </figure>
        </div>
      </section>
      <section className="floor materials-floor">
        <div className="wrap">
          <section className="materials" id="materiel-etage" aria-labelledby="materiel-etage-titre">
            <h3 id="materiel-etage-titre">Matériel du premier étage</h3>
            <div className="material-grid">
              <div className="material-card">
                <h4>Déjà acheté</h4>
                <ul>
                  <li>Baignoire</li>
                  <li>Meuble double vasque pour la salle de bains parentale</li>
                  <li>Bac de douche</li>
                </ul>
              </div>
              <div className="material-card">
                <h4>À acheter</h4>
                <ul>
                  <li>Fenêtre du palier</li>
                  <li>Fenêtre de la deuxième chambre</li>
                  <li>Fenêtre de la salle d&#39;eau du palier</li>
                  <li>Bac de douche de la salle d&#39;eau du palier</li>
                  <li>WC de la salle de bains parentale</li>
                  <li>Bâti-support et WC de la salle d&#39;eau du palier</li>
                  <li>Meuble vasque de la salle d&#39;eau du palier</li>
                  <li>Paroi de douche de la salle de bains parentale</li>
                  <li>Paroi de douche de la salle d&#39;eau du palier</li>
                  <li>Plancher chauffant</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </section>
      <section className="floor" id="rdc">
        <div className="wrap">
          <div className="kicker">Étape 02</div>
          <h2>Le rez-de-chaussée</h2>
          <div className="plan">
            <img src="/assets/rdc/plan-rdc.png" alt="Plan du rez-de-chaussée" loading="lazy" />
          </div>
          <section className="room-overview" aria-labelledby="pieces-rdc-titre">
            <h3 id="pieces-rdc-titre">Les pièces du rez-de-chaussée</h3>
            <div className="room-grid">
              <a className="room-card" href="#rdc-entree">
                <span className="num">01</span>
                <h4>Entrée</h4>
              </a>
              <a className="room-card" href="#rdc-bureau">
                <span className="num">02</span>
                <h4>Bureau</h4>
              </a>
              <a className="room-card" href="#rdc-chambre">
                <span className="num">03</span>
                <h4>Chambre</h4>
              </a>
              <a className="room-card" href="#rdc-salle-a-manger">
                <span className="num">04</span>
                <h4>Salle à manger</h4>
              </a>
              <a className="room-card" href="#rdc-salle-de-bains">
                <span className="num">05</span>
                <h4>Salle d&#39;eau</h4>
              </a>
              <a className="room-card" href="#rdc-salon-cuisine">
                <span className="num">06</span>
                <h4>Grand salon avec cuisine ouverte</h4>
              </a>
            </div>
          </section>
        </div>
      </section>
      <section className="project" id="rdc-entree">
        <div className="wrap">
          <div className="project-head">
            <div>
              <div className="kicker">Rez-de-chaussée · 01</div>
              <h3>L’entrée</h3>
            </div>
            <p>La projection associe l’escalier à une entrée lumineuse, avec parquet en chevrons, moulures et éclairages chaleureux.</p>
          </div>
          <div className="surface-detail">
            <h4>Surfaces — entrée</h4>
            <p>Dimensions : 3,70 m × 4,30 m · hauteur : 2,50 m</p>
            <table>
              <thead>
                <tr>
                  <th scope="col">Surface</th>
                  <th scope="col">Calcul</th>
                  <th scope="col">Superficie</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Deux murs de 3,70 m</td>
                  <td>2 × 3,70 × 2,50</td>
                  <td>18,50 m²</td>
                </tr>
                <tr>
                  <td>Deux murs de 4,30 m</td>
                  <td>2 × 4,30 × 2,50</td>
                  <td>21,50 m²</td>
                </tr>
                <tr>
                  <td>Plafond</td>
                  <td>3,70 × 4,30</td>
                  <td>15,91 m²</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={2}>Total murs</th>
                  <td>40,00 m²</td>
                </tr>
                <tr>
                  <th scope="row" colSpan={2}>Total murs et plafond</th>
                  <td>55,91 m²</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="compare">
            <figure className="shot">
              <GalleryPhoto index={13} />
              <span className="tag">Avant</span>
            </figure>
            <figure className="shot">
              <GalleryPhoto index={14} />
              <span className="tag">Après</span>
            </figure>
          </div>
        </div>
      </section>
      <section className="project" id="rdc-bureau">
        <div className="wrap">
          <div className="project-head">
            <div>
              <div className="kicker">Rez-de-chaussée · 02</div>
              <h3>Le bureau</h3>
            </div>
            <p>Une pièce dédiée au travail au rez-de-chaussée.</p>
          </div>
          <div className="surface-detail">
            <h4>Surfaces du bureau</h4>
            <p>Dimensions : 3,15 m × 2,80 m · hauteur : 2,50 m</p>
            <table>
              <thead>
                <tr>
                  <th scope="col">Surface</th>
                  <th scope="col">Calcul</th>
                  <th scope="col">Superficie</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Deux murs de 3,15 m</td>
                  <td>2 × 3,15 × 2,50</td>
                  <td>15,75 m²</td>
                </tr>
                <tr>
                  <td>Deux murs de 2,80 m</td>
                  <td>2 × 2,80 × 2,50</td>
                  <td>14,00 m²</td>
                </tr>
                <tr>
                  <td>Plafond</td>
                  <td>3,15 × 2,80</td>
                  <td>8,82 m²</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={2}>Total murs</th>
                  <td>29,75 m²</td>
                </tr>
                <tr>
                  <th scope="row" colSpan={2}>Total murs et plafond</th>
                  <td>38,57 m²</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="compare">
            <figure className="shot">
              <GalleryPhoto index={15} />
              <span className="tag">Avant</span>
            </figure>
            <figure className="shot">
              <GalleryPhoto index={16} />
              <span className="tag">Après</span>
            </figure>
          </div>
        </div>
      </section>
      <section className="project" id="rdc-chambre">
        <div className="wrap">
          <div className="project-head">
            <div>
              <div className="kicker">Rez-de-chaussée · 03</div>
              <h3>La chambre</h3>
            </div>
            <p>La projection montre une chambre aux tons doux, avec parquet en chevrons, moulures et rangements intégrés.</p>
          </div>
          <div className="surface-detail">
            <h4>Surfaces de la chambre</h4>
            <p>Dimensions : 4,60 m × 3,40 m · hauteur : 2,50 m</p>
            <table>
              <thead>
                <tr>
                  <th scope="col">Surface</th>
                  <th scope="col">Calcul</th>
                  <th scope="col">Superficie</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Deux murs de 4,60 m</td>
                  <td>2 × 4,60 × 2,50</td>
                  <td>23,00 m²</td>
                </tr>
                <tr>
                  <td>Deux murs de 3,40 m</td>
                  <td>2 × 3,40 × 2,50</td>
                  <td>17,00 m²</td>
                </tr>
                <tr>
                  <td>Plafond</td>
                  <td>4,60 × 3,40</td>
                  <td>15,64 m²</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={2}>Total murs</th>
                  <td>40,00 m²</td>
                </tr>
                <tr>
                  <th scope="row" colSpan={2}>Total murs et plafond</th>
                  <td>55,64 m²</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="compare">
            <figure className="shot">
              <GalleryPhoto index={17} />
              <span className="tag">Avant</span>
            </figure>
            <figure className="shot">
              <GalleryPhoto index={18} />
              <span className="tag">Après</span>
            </figure>
          </div>
        </div>
      </section>
      <section className="project" id="rdc-salle-a-manger">
        <div className="wrap">
          <div className="project-head">
            <div>
              <div className="kicker">Rez-de-chaussée · 04</div>
              <h3>La salle à manger</h3>
            </div>
            <p>La projection présente une salle à manger ouverte vers la cuisine, avec parquet en chevrons et grande baie vitrée.</p>
          </div>
          <div className="surface-detail">
            <h4>Surfaces de la salle à manger</h4>
            <p>Dimensions : 3,65 m × 3,30 m · hauteur : 2,50 m</p>
            <table>
              <thead>
                <tr>
                  <th scope="col">Surface</th>
                  <th scope="col">Calcul</th>
                  <th scope="col">Superficie</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Deux murs de 3,65 m</td>
                  <td>2 × 3,65 × 2,50</td>
                  <td>18,25 m²</td>
                </tr>
                <tr>
                  <td>Deux murs de 3,30 m</td>
                  <td>2 × 3,30 × 2,50</td>
                  <td>16,50 m²</td>
                </tr>
                <tr>
                  <td>Plafond</td>
                  <td>3,65 × 3,30</td>
                  <td>12,05 m²</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={2}>Total murs</th>
                  <td>34,75 m²</td>
                </tr>
                <tr>
                  <th scope="row" colSpan={2}>Total murs et plafond</th>
                  <td>46,80 m²</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="compare">
            <figure className="shot">
              <GalleryPhoto index={19} />
              <span className="tag">Avant</span>
            </figure>
            <figure className="shot">
              <GalleryPhoto index={20} />
              <span className="tag">Après</span>
            </figure>
          </div>
        </div>
      </section>
      <section className="project" id="rdc-salle-de-bains">
        <div className="wrap">
          <div className="project-head">
            <div>
              <div className="kicker">Rez-de-chaussée · 05</div>
              <h3>La salle d&#39;eau</h3>
            </div>
            <p>Une salle d&#39;eau complète les espaces de vie du rez-de-chaussée.</p>
          </div>
          <div className="surface-detail">
            <h4>Surfaces de la salle d&#39;eau</h4>
            <p>Dimensions : 3,30 m × 1,80 m · hauteur : 2,50 m</p>
            <table>
              <thead>
                <tr>
                  <th scope="col">Surface</th>
                  <th scope="col">Calcul</th>
                  <th scope="col">Superficie</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Deux murs de 3,30 m</td>
                  <td>2 × 3,30 × 2,50</td>
                  <td>16,50 m²</td>
                </tr>
                <tr>
                  <td>Deux murs de 1,80 m</td>
                  <td>2 × 1,80 × 2,50</td>
                  <td>9,00 m²</td>
                </tr>
                <tr>
                  <td>Plafond</td>
                  <td>3,30 × 1,80</td>
                  <td>5,94 m²</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={2}>Total murs</th>
                  <td>25,50 m²</td>
                </tr>
                <tr>
                  <th scope="row" colSpan={2}>Total murs et plafond</th>
                  <td>31,44 m²</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="compare">
            <figure className="shot">
              <GalleryPhoto index={21} />
              <span className="tag">Avant</span>
            </figure>
            <figure className="shot">
              <GalleryPhoto index={22} />
              <span className="tag">Après</span>
            </figure>
          </div>
        </div>
      </section>
      <section className="project" id="rdc-salon-cuisine">
        <div className="wrap">
          <div className="project-head">
            <div>
              <div className="kicker">Rez-de-chaussée · 06</div>
              <h3>Le salon et la cuisine ouverte</h3>
            </div>
            <p>Un grand espace de vie réunit le salon et la cuisine ouverte.</p>
          </div>
          <div className="surface-detail">
            <h4>Surfaces du salon et de la cuisine ouverte</h4>
            <p>Dimensions : 11,30 m × 4,00 m · hauteur : 2,50 m</p>
            <table>
              <thead>
                <tr>
                  <th scope="col">Surface</th>
                  <th scope="col">Calcul</th>
                  <th scope="col">Superficie</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Deux grands murs</td>
                  <td>2 × 11,30 × 2,50</td>
                  <td>56,50 m²</td>
                </tr>
                <tr>
                  <td>Deux petits murs</td>
                  <td>2 × 4,00 × 2,50</td>
                  <td>20,00 m²</td>
                </tr>
                <tr>
                  <td>Plafond</td>
                  <td>11,30 × 4,00</td>
                  <td>45,20 m²</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={2}>Total murs</th>
                  <td>76,50 m²</td>
                </tr>
                <tr>
                  <th scope="row" colSpan={2}>Total murs et plafond</th>
                  <td>121,70 m²</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <h4>Le salon</h4>
          <div className="compare">
            <figure className="shot">
              <GalleryPhoto index={23} />
              <span className="tag">Avant · salon</span>
            </figure>
            <figure className="shot">
              <GalleryPhoto index={24} />
              <span className="tag">Après · salon</span>
            </figure>
          </div>
          <h4 style={{ marginTop: 40 }}>La cuisine ouverte</h4>
          <div className="compare">
            <figure className="shot">
              <GalleryPhoto index={25} />
              <span className="tag">Avant · cuisine</span>
            </figure>
            <figure className="shot">
              <GalleryPhoto index={26} />
              <span className="tag">Après · cuisine</span>
            </figure>
          </div>
        </div>
      </section>
      <section className="floor" id="exterieur">
        <div className="wrap">
          <div className="kicker">Étape 03</div>
          <h2>Les extérieurs</h2>
          <p>À venir.</p>
        </div>
      </section>
      <footer>
        <div className="wrap">Projet de rénovation · Maison familiale</div>
      </footer>
    </Gallery>
  );
}
