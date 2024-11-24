import fetch, { Response } from "node-fetch";
import { map, mergeMap } from "rxjs/operators";
import { get } from "./utils";
import { forkJoin, of } from "rxjs";

/* 
Read data from https://swapi.dev/api/people/1 (Luke Skywalker)
and dependent data from swapi to return the following object

{
    name: 'Luke Skywalker',
    height: 172,
    gender: 'male',
    homeworld: 'Tatooine',
    films: [
        {
            title: 'A New Hope',
            director: 'George Lucas',
            release_date: '1977-05-25'
        },
        ... // and all other films
    ]
}

Define an interface of the result type above and all other types as well.

*/

interface Person {
  name: string;
  height: string;
  gender: "male" | "female" | "divers";
  homeworld: string;
  films: string[];
}

export interface PersonInfo {
  // TODO: define type
  name: string;
  height: string;
  gender: "male" | "female" | "divers";
  homeworld: string;
  films: Film [];
}

interface Film {
  title: string;
  director: string;
  release_date: string;
}

interface Homeworld {
  name: string;
}

// Task 1: write a function using promise based fetch api
type PromiseBasedFunction = () => Promise<PersonInfo>;
export const getLukeSkywalkerInfo: PromiseBasedFunction = () => {
  return fetch("https://swapi.dev/api/people/1").then((response: Response) => {
    return response.json().then((person: Person) => {
      // Fetch film data
      const filmPromises = person.films.map((filmUrl) =>
        fetch(filmUrl).then((filmResponse) => filmResponse.json())
      );
      // Fetch homeworld data
      const homeworldPromise = fetch(person.homeworld).then((homeworldResponse) =>
        homeworldResponse.json()
      );

      return Promise.all([Promise.all(filmPromises), homeworldPromise]).then(
        ([films, homeworld]) => {
          // Map films to the correct format
          const formattedFilms = films.map((film) => ({
            title: film.title,
            director: film.director,
            release_date: film.release_date,
          }));

        // Return the final PersonInfo object
        return {
          name: person.name,
          height: person.height,
          gender: person.gender,
          homeworld: homeworld.name,
          films: formattedFilms,
        } as PersonInfo;
      });
    });
  });
};

// Task 2: write a function using async and await
// see also: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-1-7.html
type AsyncBasedFunction = () => Promise<PersonInfo>;
export const getLukeSkywalkerInfoAsync: PromiseBasedFunction = async () => {
  const response = await fetch("https://swapi.dev/api/people/1");
  // TODO: load other stuff and return LukeSkywalkerInfo
  const person: Person = await response.json();
  // Fetch film data
  const filmPromises = person.films.map((filmUrl) => fetch(filmUrl).then((filmResponse) => filmResponse.json()));
  const films = await Promise.all(filmPromises);
  // Fetch homeworld data
  const homeworldResponse = await fetch(person.homeworld);
  const homeworld = await homeworldResponse.json();

  const formattedFilms = films.map((film) => ({
    title: film.title,
    director: film.director,
    release_date: film.release_date,
  }));

  // Return the final PersonInfo object with homeworld data
  return {
    name: person.name,
    height: person.height,
    gender: person.gender,
    homeworld: homeworld.name, 
    films: formattedFilms,
  } as PersonInfo;
};

// Task 3: write a function using Observable based api
// see also: https://rxjs.dev/api/index/function/forkJoin
export const getLukeSkywalkerInfoObservable = () => {
  return get<Person>("https://swapi.dev/api/people/1").pipe(
    mergeMap((person: Person) => {
      // TODO: load other stuff and return LukeSkywalkerInfo
      // Fetch all film details
      const films$ = forkJoin(person.films.map((filmUrl) => get<Film>(filmUrl))); // Now typed as 'Film'

      // Fetch homeworld details
      const homeworld$ = get<Homeworld>(person.homeworld); // Now typed as 'Homeworld'

      return forkJoin({
        person: of(person),
        films: films$,
        homeworld: homeworld$
      }).pipe(
        mergeMap(({ person, films, homeworld }) => {
          return of({
            name: person.name,
            height: person.height,
            gender: person.gender,
            homeworld: homeworld.name, 
            films: films.map((film) => ({
              title: film.title,
              director: film.director,
              release_date: film.release_date
            }))
          } as PersonInfo);
        })
      );
    })
  );
};