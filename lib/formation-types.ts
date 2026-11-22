export type Formation={
 id:string;title:string;track:string;description:string;pages:number;
 originalName:string;related:string[];notice:string;year:number|null;
 sections:{title:string;body:string}[];sha256:string;optimizedForWeb:boolean;
 ready?:boolean;hasTranscript?:boolean;
};
