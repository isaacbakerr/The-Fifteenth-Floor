export interface Artwork {
  artist:string;
  title:string;
  year:string;
  background:string;
  source:string;
}

import {sacredArtworks} from './exhibits/collection/Sacred';
import {illusionArtworks} from './exhibits/collection/Illusions';
import {dreamArtworks} from './exhibits/collection/Dreams';

/** Shared exhibition copy: every playable floor supplies the same title-card data. */
export const ARTWORKS={
  ...sacredArtworks,...illusionArtworks,...dreamArtworks,
  'persistence-of-memory':{
    artist:'Salvador Dalí',title:'The Persistence of Memory',year:'1931',
    background:'Dalí placed his soft watches in a landscape drawn from the Catalan coast. The melting timepieces and dreamlike sleeping form unsettle familiar ideas of permanence, while the still sea and distant cliffs anchor the scene in the world he knew.',
    source:'https://www.moma.org/collection/works/79018',
  },
  'the-elephants':{
    artist:'Salvador Dalí',title:'The Elephants',year:'1948',
    background:'Elephants recur in Dalí’s dream landscapes. Here, monumental bodies and obelisks balance on impossibly slender legs, turning a familiar image of strength into one of fragility. The empty sunset landscape heightens their strange, precarious stillness.',
    source:'https://www.culturefrontier.com/dali-paintings/',
  },
  sleep:{
    artist:'Salvador Dalí',title:'Sleep',year:'1937',
    background:'Created for the collector and patron Edward James, Sleep explores the fragile world of dreams. Its enormous, disembodied head depends on delicate crutches—supports that suggest how easily the apparent stability of reality can give way to the unconscious.',
    source:'https://blog.artsper.com/en/a-closer-look/salvador-dali-famous-paintings/',
  },
} satisfies Record<string,Artwork>;

export function updateArtworkCard(card:HTMLElement,artwork:Artwork){
  card.querySelector<HTMLElement>('#artwork-artist')!.textContent=artwork.artist;
  card.querySelector<HTMLElement>('#artwork-title')!.textContent=artwork.title;
  const year=card.querySelector<HTMLTimeElement>('#artwork-year')!;year.textContent=artwork.year;year.dateTime=artwork.year;
  card.querySelector<HTMLElement>('#artwork-background')!.textContent=artwork.background;
  card.hidden=false;
}
