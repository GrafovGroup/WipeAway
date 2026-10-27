"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { submitInquiry } from "../lib/inquiry.mjs";
import { phoneDisplay, phoneHref } from "./site-data";
export function QuoteForm({lang="en"}:{lang?:"en"|"fr"}){
  const fr=lang==="fr";
  const [status,setStatus]=useState<"idle"|"sending"|"success"|"error">("idle");
  const [product,setProduct]=useState("");
  const feedback=useRef<HTMLDivElement>(null);
  useEffect(()=>{setProduct(new URLSearchParams(window.location.search).get("product")?.slice(0,120)||"");},[]);
  useEffect(()=>{if(status==="success"||status==="error")feedback.current?.focus();},[status]);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault(); if(status==="sending")return;
    const form=event.currentTarget;setStatus("sending");
    try{await submitInquiry(form.action,new FormData(form));
      setStatus("success");form.reset();setProduct("");
      window.dispatchEvent(new CustomEvent("wipeaway:inquiry-submitted",{detail:{language:lang}}));
    }catch{setStatus("error");}
  }
  if(status==="success")return <div className="quote-form form-success" ref={feedback} tabIndex={-1} role="status"><h2>{fr?"Merci. Votre demande a été transmise.":"Thank you. Your request has been submitted."}</h2><p>{fr?"Notre équipe examinera votre demande et vous répondra aux coordonnées fournies.":"Our team will review your details and follow up using the contact information you provided."}</p><button type="button" className="button button-blue" onClick={()=>setStatus("idle")}>{fr?"ENVOYER UNE AUTRE DEMANDE":"SEND ANOTHER REQUEST"}</button></div>;
  return <form className="quote-form" action="https://formspree.io/f/xdeownaz" method="POST" onSubmit={submit} aria-busy={status==="sending"}>
    <input type="hidden" name="_subject" value="New WipeAway.ca commercial inquiry"/>
    <input type="hidden" name="source" value="WipeAway.ca"/><input type="hidden" name="language" value={fr?"fr-CA":"en-CA"}/>
    <div className="honeypot" aria-hidden="true"><label>Leave empty<input name="_gotcha" tabIndex={-1} autoComplete="off"/></label></div>
    <label>{fr?"NOM *":"NAME *"}<input required name="name" autoComplete="name" maxLength={120}/></label>
    <label>{fr?"COURRIEL *":"EMAIL *"}<input required type="email" name="email" autoComplete="email" maxLength={254}/></label>
    <label>{fr?"TÉLÉPHONE (FACULTATIF)":"PHONE (OPTIONAL)"}<input type="tel" name="phone" autoComplete="tel" maxLength={40}/></label>
    <label>{fr?"ENTREPRISE (FACULTATIF)":"COMPANY (OPTIONAL)"}<input name="company" autoComplete="organization" maxLength={160}/></label>
    <label className="form-wide">{fr?"PRODUIT / MODÈLE (FACULTATIF)":"PRODUCT / MODEL (OPTIONAL)"}<input name="product" value={product} onChange={e=>setProduct(e.target.value)} maxLength={120} placeholder={fr?"Ex. : Quadrato, recharges ou programme complet":"e.g. Quadrato, refill wipes or a complete program"}/></label>
    <label className="form-wide">{fr?"VOTRE BESOIN *":"WHAT DO YOU NEED? *"}<textarea required name="message" rows={5} maxLength={5000} placeholder={fr?"Quantité, ville de livraison, type d’établissement et échéancier":"Quantity, delivery city, facility type and any timing requirements"}/></label>
    <button className="button button-blue" type="submit" disabled={status==="sending"}>{status==="sending"?(fr?"ENVOI…":"SENDING…"):(fr?"DEMANDER UN PRIX":"REQUEST PRICING")}</button>
    <p className="form-note">{fr?"* Champs obligatoires":"* Required fields"}</p>
    {status==="error"&&<div className="form-error form-wide" role="alert" ref={feedback} tabIndex={-1}>{fr?"Nous n’avons pas pu confirmer l’envoi. Vos renseignements sont conservés dans le formulaire. Réessayez ou appelez le ":"We couldn’t confirm submission. Your details are still here. Please try again or call "}<a href={phoneHref}>{phoneDisplay}</a>.</div>}
  </form>;
}
