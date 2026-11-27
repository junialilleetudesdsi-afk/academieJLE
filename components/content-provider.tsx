'use client';
import {createContext,useContext} from 'react';
import type {AcademyContent} from '../lib/content-types';
const Context=createContext<AcademyContent|null>(null);
export function ContentProvider({value,children}:{value:AcademyContent;children:React.ReactNode}){return <Context.Provider value={value}>{children}</Context.Provider>}
export function useAcademyContent(){const value=useContext(Context);if(!value)throw new Error('Session nécessaire.');return value}
