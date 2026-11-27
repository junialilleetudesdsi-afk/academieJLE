import type catalog from '../content/catalog.json';
import type processes from '../content/processes.json';
import type {Formation} from './formation-types';
export type Catalog=typeof catalog;
export type Question=Catalog['questions'][number];
export type Article=Catalog['articles'][number];
export type AcademyContent={catalog:Catalog;formations:Formation[];processes:typeof processes};
