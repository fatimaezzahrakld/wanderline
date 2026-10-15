"use client";
import {useState} from 'react';
import {remotePhotos} from '@/data/photos';
export default function ScenicImage({id,fallback,alt,priority=false,className=''}:{id:string;fallback:string;alt:string;priority?:boolean;className?:string}){
 const [failed,setFailed]=useState(false);
 return <img className={className} src={failed?(fallback):remotePhotos[id]||fallback} onError={()=>setFailed(true)} alt={alt} loading={priority?'eager':'lazy'} decoding="async"/>;
}
