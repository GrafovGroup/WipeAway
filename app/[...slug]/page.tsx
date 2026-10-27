import {models, industries} from "../catalog";
import {BuyerPage} from "../buyer-pages";
import {FrenchPage,frenchMeta} from "../french-page";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { QuoteForm } from "../quote-form";
import { PageFrame } from "../site-shell";
import { phoneDisplay, phoneHref, products } from "../site-data";
import { articles, cities, cityBySlug, legacyCityRoutes, productDetails } from "../content";

type RouteProps = {params:Promise<{slug:string[]}>};
const asset=(name:string)=>name.startsWith("/")?name:`/legacy-assets/${name}`;

const metaByPath:Record<string,{title:string;description:string}> = {
  products:{title:"Commercial Wipes, Dispensers & Signs Canada",description:"Compare commercial wipe dispensers, refill wipes, signs and specialty products. Plan compatible wipe stations for Canadian facilities."},
  about:{title:"About Our Commercial Wipe Systems",description:"Learn how WipeAway helps Canadian facility teams source commercial wipe dispensers, refills, signage and specialty wipe products."},
  order:{title:"Request Wipe Dispenser Pricing in Canada",description:"Request product information and commercial pricing for WipeAway dispensers, refill wipes, signs and specialty wipe products."},
  locations:{title:"Commercial Wipe Dispensers Across Canada",description:"Explore WipeAway commercial dispenser and refill support for major cities and facility portfolios across Canada."},
  blog:{title:"Wipe Digest | Commercial Facility Resources",description:"Practical resources about commercial wipe dispensers, refill programs, placement, signage and facility operations."},
  "clients-that-use-our-wipe-stands":{title:"Facilities Using WipeAway Products",description:"See organizations and facility environments featured on the original WipeAway client page."},
};

async function englishMetadata({params}:RouteProps):Promise<Metadata>{
  const {slug}=await params; const path=slug.join("/");
  if(slug.length>(slug[0]==="fr"?3:2)) notFound();
  if(path.startsWith("locations/") && slug[1]){
    const city=cityBySlug.get(slug[1]); if(city) return {title:`Commercial Wipe Dispensers in ${city.name}, ${city.province}`,description:`WipeAway supplies commercial wipe dispensers, refill wipes and signage for ${city.focus} in ${city.name} and ${city.region}.`,alternates:{canonical:`/locations/${city.slug}`}};
  }
  if(path.startsWith("products/") && slug[1] && slug[1] in productDetails){
    const p=productDetails[slug[1] as keyof typeof productDetails];
    return {title:`${p.title} in Canada`,description:p.intro,alternates:{canonical:`/products/${slug[1]}`}};
  }
  if(path.startsWith("blog/") && slug[1] && slug[1] in articles){
    const a=articles[slug[1] as keyof typeof articles]; return {title:a.title,description:a.intro,alternates:{canonical:`/blog/${slug[1]}`}};
  }
  const meta=metaByPath[path]; return meta?{...meta,alternates:{canonical:`/${path}`}}:{};
}

function Breadcrumbs({items}:{items:Array<[string,string?]>}){return <><JsonLd data={{"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:items.map(([name,href],i)=>({"@type":"ListItem",position:i+1,name,...(href?{item:`https://wipeaway.ca${href}`}:{})}))}}/><nav className="breadcrumbs" aria-label="Breadcrumb">{items.map(([label,href],i)=><span key={`${label}-${i}`}>{i>0&&<i>/</i>}{href?<Link href={href}>{label}</Link>:label}</span>)}</nav></>}
function JsonLd({data}:{data:object}){return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(data)}}/>}
function InnerHero({eyebrow,title,intro,image,children}:{eyebrow:string;title:string;intro:string;image?:string;children?:React.ReactNode}){return <section className={`inner-hero ${image?"has-image":""}`}><div className="shell inner-hero-grid"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{intro}</p>{children}</div>{image&&<div className="inner-hero-image"><img src={image} alt={title}/></div>}</div></section>}
function QuoteBand({title="Build a wipe program around your facilities."}:{title?:string}){return <section className="cta-band"><div className="shell"><div><p className="eyebrow">COMMERCIAL INQUIRIES ACROSS CANADA</p><h2>{title}</h2></div><Link className="button button-white" href="/order">REQUEST INFORMATION &amp; PRICING</Link></div></section>}

function ProductPage({productKey}:{productKey:keyof typeof productDetails}){
  const p=productDetails[productKey]; const path=`/products/${productKey}`;
  return <PageFrame><main id="main-content"><Breadcrumbs items={[["HOME","/"],["PRODUCTS","/products"],[p.title.toUpperCase()]]}/><InnerHero eyebrow={p.eyebrow} title={p.title} intro={p.intro} image={p.image}><div className="hero-actions"><Link className="button button-blue" href="/order">REQUEST PRICING</Link><a className="text-link" href={phoneHref}>CALL {phoneDisplay}</a></div></InnerHero>
    <section className="section shell"><div className="section-heading"><div><p className="eyebrow blue">PRODUCT OPTIONS</p><h2>Find the right format for the space.</h2>{productKey==="wipe-dispensers"&&<Link className="text-link" href="/compare/">COMPARE ALL SEVEN MODELS →</Link>}</div><p>Product specifications and availability can vary. We’ll confirm compatible formats and current commercial options as part of your inquiry.</p></div><div className="model-grid">{p.items.map(([name,desc,image],i)=><article className="model-card" key={name}><div><span>{String(i+1).padStart(2,"0")}</span><img loading="lazy" decoding="async" src={image} alt={`${name} ${p.title.toLowerCase()}`}/></div><h2>{name}</h2><p>{desc}</p><Link href={productKey==="wipe-dispensers"?`/dispensers/${name.toLowerCase()}/`:`/order?product=${encodeURIComponent(name)}`}>{productKey==="wipe-dispensers"?"EXPLORE":"ASK ABOUT"} {name.toUpperCase()} ↗</Link></article>)}</div></section>
    <section className="feature-band"><div className="shell feature-grid"><div><p className="eyebrow">PROGRAM FEATURES</p><h2>Specify products with the whole facility in mind.</h2></div><ul>{p.benefits.map(x=><li key={x}>{x}</li>)}</ul></div></section>
    <section className="section shell faq-section"><p className="eyebrow blue">COMMON QUESTIONS</p><h2>Before you choose.</h2><div>{p.faq.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section><QuoteBand/>
    <JsonLd data={{"@context":"https://schema.org","@type":"CollectionPage",name:p.title,description:p.intro,url:`https://wipeaway.ca${path}`,mainEntity:{"@type":"ItemList",itemListElement:p.items.map(([name,description,image],i)=>({"@type":"ListItem",position:i+1,item:{"@type":"Product",name,description,image:`https://wipeaway.ca${image}`,brand:{"@type":"Brand",name:"WipeAway"}}}))}}}/><JsonLd data={{"@context":"https://schema.org","@type":"FAQPage",mainEntity:p.faq.map(([q,a])=>({"@type":"Question",name:q,acceptedAnswer:{"@type":"Answer",text:a}}))}}/>
  </main></PageFrame>;
}

function ProductsPage(){return <PageFrame><main id="main-content"><Breadcrumbs items={[["HOME","/"],["PRODUCTS"]]}/><InnerHero eyebrow="COMMERCIAL WIPE SYSTEMS" title="Find the right products for your facility." intro="Choose dispensers, compatible refills and clear signage together. Request current specifications and pricing before committing to a facility rollout."/><section className="section shell"><div className="product-grid">{products.map(p=><Link className="product-card" href={p.href} key={p.href}><div className="product-image"><img loading="lazy" src={p.image} alt={p.title}/></div><h2>{p.title}</h2><p>{p.description}</p><b>EXPLORE OPTIONS ↗</b></Link>)}</div></section><section className="section shell"><p className="eyebrow blue">BUYING CHECKLIST</p><h2>What to confirm before ordering</h2><div className="table-scroll"><table className="selection-table"><thead><tr><th scope="col">Your requirement</th><th scope="col">What to compare</th><th scope="col">Start here</th></tr></thead><tbody><tr><th scope="row">A new wipe station</th><td>Floor space, finish, container size and servicing access.</td><td><Link href="/products/wipe-dispensers">Dispenser formats →</Link></td></tr><tr><th scope="row">Refills for an existing stand</th><td>Model, internal dimensions, bag or bucket format and intended surface.</td><td><Link href="/products/disinfecting-sanitizing-refill-wipes">Refill options →</Link></td></tr><tr><th scope="row">Visible instructions</th><td>Mounting compatibility, finish, message and language.</td><td><Link href="/products/wipe-dispenser-signs">Dispenser signs →</Link></td></tr><tr><th scope="row">Multiple facilities</th><td>Station count per location, delivery addresses, consumption and storage.</td><td><Link href="/order?product=Complete%20wipe%20program">Request program pricing →</Link></td></tr></tbody></table></div></section><QuoteBand/></main></PageFrame>}

function AboutPage(){return <PageFrame><main id="main-content"><Breadcrumbs items={[["HOME","/"],["ABOUT"]]}/><InnerHero eyebrow="ABOUT WIPEAWAY" title="A practical source for better wipe stations." intro="WipeAway helps commercial facility teams bring dispensers, refill wipes, signage and specialty products together as a coordinated program." image="/legacy-assets/wipeaway-about-4d7823a3e9.jpg"/>
  <section className="section shell story-grid"><div><p className="eyebrow blue">WHY WE EXIST</p><h2>From loose wipe containers to an intentional facility system.</h2></div><div><p>Wet wipes are most useful when occupants can see them, understand them and access them easily. WipeAway focuses on the complete station: equipment that suits the setting, refills that work with it and communication that helps people take action.</p><p>As a brand of Facility Unlimited Corp., WipeAway works with commercial inquiries across Canada. Our role is to help you narrow practical product options for your building type, site count, placement and maintenance routine.</p></div></section>
  <section className="facility-band"><div className="shell number-grid"><article><strong>01</strong><h2>Equipment</h2><p>Floor stands and dispensers in formats suited to different footprints.</p></article><article><strong>02</strong><h2>Consumables</h2><p>Commercial refill wipes selected with capacity and intended use in mind.</p></article><article><strong>03</strong><h2>Communication</h2><p>Signs that make stations easier to recognize and use.</p></article></div></section><QuoteBand title="Tell us where the stations need to work."/></main></PageFrame>}

const clientLogos=["nasa-2c3131b35f.png","fourseasons-9a0040bba0.png","oxford-a40e804816.png","brookfiled-a2dddc6f98.png","cf-51b7e0cd4c.png","hines-0326bd2d4d.png","quadreal-2c04cdb156.png","colliers-02a0547f9f.png","menkes-34b2fe707f.png","triovest-35d56bd9da.png","yorkdale-3b7c0bef36.png","ritz-86712dc9f1.png","jw-marriott-6d98b00433.png","hockey-canada-2b7ecc9856.png","oilers-48bd1aa8e8.png","calgary-stampede-67f2a4fdf5.png","granite-club-0104a419bf.png","bayview-village-7fbf622121.png"];
function ClientsPage(){return <PageFrame><main id="main-content"><Breadcrumbs items={[["HOME","/"],["CLIENTS"]]}/><InnerHero eyebrow="FACILITY ENVIRONMENTS" title="Wipe stations made for real buildings." intro="The organizations below were featured on WipeAway’s original client page. They illustrate the range of commercial, hospitality, retail, sports and institutional environments that use wipe stations." image="/legacy-assets/wipeaway-wipe-disp-f56d7b519f.jpg"/>
  <section className="section shell"><div className="client-grid">{clientLogos.map((logo,i)=><div key={logo}><img loading="lazy" decoding="async" src={asset(logo)} alt={`Featured organization ${i+1}`}/></div>)}</div></section>
  <section className="section shell"><div className="photo-mosaic"><img src="/legacy-assets/wipeaway-wipe-disp-562122a49a.jpg" alt="WipeAway dispenser in a commercial lobby"/><img src="/legacy-assets/wipeaway-wipe-disp-bc11a2c560.jpg" alt="Commercial wipe station in a shared facility"/><img src="/legacy-assets/wipeaway-wipe-disp-8c32a5cbda.jpg" alt="Wipe station placed in a Canadian facility"/></div></section><QuoteBand/></main></PageFrame>}

function OrderPage(){return <PageFrame><main id="main-content"><Breadcrumbs items={[["HOME","/"],["REQUEST PRICING"]]}/><section className="contact-hero"><div className="shell contact-grid"><div><p className="eyebrow">COMMERCIAL PRODUCT INQUIRY</p><h1>Tell us about your wipe program.</h1><p>Share the product category, site count and any placement details you already know. WipeAway will follow up with relevant information and commercial pricing.</p><a className="contact-phone" href={phoneHref}>{phoneDisplay}</a><div className="contact-checks"><span>CANADA-WIDE INQUIRIES</span><span>PRODUCT &amp; COMPATIBILITY GUIDANCE</span><span>PORTFOLIO AND MULTI-SITE REQUESTS</span></div></div><QuoteForm/></div></section></main></PageFrame>}

function LocationsPage(){return <PageFrame><main id="main-content"><Breadcrumbs items={[["HOME","/"],["LOCATIONS"]]}/><InnerHero eyebrow="CANADA-WIDE COMMERCIAL SUPPLY" title="Wipe systems for facilities across Canada." intro="Explore local planning considerations for major Canadian markets. WipeAway supports commercial product inquiries nationally, subject to availability and delivery requirements." image="/legacy-assets/wetwiper-header-im-204d2ef158.jpeg"/>
  <section className="section shell"><div className="section-heading"><div><p className="eyebrow blue">CITY GUIDES</p><h2>Start with the facilities you operate.</h2></div><p>Compare placement, refill requirements and delivery needs for your local facilities. For multi-city portfolios, send one consolidated inquiry.</p></div><div className="city-grid">{cities.map(city=><Link href={`/locations/${city.slug}`} key={city.slug}><span>{city.province}</span><h2>{city.name}</h2><p>{city.focus}</p><b>EXPLORE {city.name.toUpperCase()} ↗</b></Link>)}</div></section><QuoteBand title="Planning one location or a national portfolio?"/></main></PageFrame>}

function CityPage({city}:{city:(typeof cities)[number]}){const related=cities.filter(c=>c.province===city.province&&c.slug!==city.slug).slice(0,3);return <PageFrame><main id="main-content"><Breadcrumbs items={[["HOME","/"],["LOCATIONS","/locations"],[city.name.toUpperCase()]]}/><InnerHero eyebrow={`${city.name.toUpperCase()} • ${city.province.toUpperCase()}`} title={`Commercial wipe dispensers in ${city.name}`} intro={`WipeAway supplies commercial dispensers, refill wipes and signage for ${city.focus} in ${city.name} and ${city.region}.`} image={city.image}><div className="hero-actions"><Link className="button button-blue" href="/order">REQUEST LOCAL PRICING</Link><a className="text-link" href={phoneHref}>CALL {phoneDisplay}</a></div></InnerHero>
  <section className="section shell local-grid"><div><p className="eyebrow blue">LOCAL PROGRAM PLANNING</p><h2>Match the station to the building—not just the city.</h2><p>{city.detail}</p><p>WipeAway can help compare commercial floor stands, refill formats and signs based on your placement, traffic and servicing plan. Product availability and delivery are confirmed with each request.</p></div><aside><h2>COMMON FACILITY TYPES</h2>{city.sectors.map(s=><span key={s}>{s}</span>)}<h2>SERVICE AREA CONTEXT</h2><p>{city.name}, {city.nearby.join(", ")} and surrounding communities in {city.region}.</p></aside></section>
  <section className="feature-band"><div className="shell"><div className="section-heading"><div><p className="eyebrow">AVAILABLE PRODUCT CATEGORIES</p><h2>One source for the complete station.</h2></div><p>Choose equipment, consumables and communication together, or ask about a specific component.</p></div><div className="mini-product-grid">{products.map(p=><Link key={p.href} href={p.href}><h3>{p.title}</h3><span>VIEW CATEGORY ↗</span></Link>)}</div></div></section>
  {related.length>0&&<section className="section shell"><p className="eyebrow blue">MORE IN {city.province.toUpperCase()}</p><div className="related-grid">{related.map(c=><Link href={`/locations/${c.slug}`} key={c.slug}><h2>{c.name}</h2><span>VIEW CITY ↗</span></Link>)}</div></section>}<QuoteBand title={`Plan a wipe station program for ${city.name}.`}/>
  <JsonLd data={{"@context":"https://schema.org","@type":"Service",name:`Commercial wipe dispensers and refills in ${city.name}`,provider:{"@type":"Organization",name:"WipeAway",telephone:"+18886632244",url:"https://wipeaway.ca"},areaServed:{"@type":"City",name:city.name,containedInPlace:{"@type":"AdministrativeArea",name:city.province}},serviceType:"Commercial wipe dispenser and refill supply",url:`https://wipeaway.ca/locations/${city.slug}`}}/>
  </main></PageFrame>}

function BlogPage(){return <PageFrame><main id="main-content"><Breadcrumbs items={[["HOME","/"],["WIPE DIGEST"]]}/><InnerHero eyebrow="WIPE DIGEST" title="Practical thinking for cleaner shared spaces." intro="Guidance for facility teams planning, placing and maintaining commercial wipe stations." image="/legacy-assets/wipeaway-chronicle-65efa676d2.jpg"/><section className="section shell article-grid">{Object.entries(articles).map(([slug,a])=><Link href={`/blog/${slug}`} key={slug}><img src={a.image} alt={a.title}/><span>{a.date} • {a.reading}</span><h2>{a.title}</h2><p>{a.intro}</p><b>READ ARTICLE ↗</b></Link>)}</section><QuoteBand/></main></PageFrame>}

function ArticlePage({slug}:{slug:keyof typeof articles}){const a=articles[slug];return <PageFrame><main id="main-content"><Breadcrumbs items={[["HOME","/"],["WIPE DIGEST","/blog"],[a.title.toUpperCase()]]}/><article className="article"><header><div className="shell"><p className="eyebrow blue">WIPE DIGEST • {a.reading}</p><h1>{a.title}</h1><p>{a.intro}</p><span>{a.date}</span></div></header><img className="article-lead" src={a.image} alt={a.title}/><div className="article-body">{a.sections.map(([heading,text])=><section key={heading}><h2>{heading}</h2><p>{text}</p></section>)}<aside><h2>Need help selecting a commercial wipe system?</h2><p>Tell WipeAway about your site count, facility type and preferred product format.</p><Link className="button button-blue" href="/order">REQUEST INFORMATION</Link></aside></div></article><QuoteBand/><JsonLd data={{"@context":"https://schema.org","@type":"Article",headline:a.title,description:a.intro,image:`https://wipeaway.ca${a.image}`,datePublished:new Date(a.date).toISOString().slice(0,10),dateModified:"2026-10-27",author:{"@type":"Organization",name:"WipeAway"},publisher:{"@type":"Organization",name:"WipeAway"},mainEntityOfPage:`https://wipeaway.ca/blog/${slug}`}}/></main></PageFrame>}

export default async function CatchAllPage({params}:RouteProps){const {slug}=await params; const path=slug.join("/");
  if(slug.length>(slug[0]==="fr"?3:2)) notFound();
  if(path==="blog/best-pracitces-for-sanitizing-wipe-dispensers-in-office-buildings") permanentRedirect("/blog/best-practices-for-sanitizing-wipe-dispensers-in-office-buildings");
  if(path in legacyCityRoutes) permanentRedirect(`/locations/${legacyCityRoutes[path]}`);
  const isFr=slug[0]==="fr"; const parts=isFr?slug.slice(1):slug; const local=parts.join("/");
  if(local==="compare") return <BuyerPage kind="compare" lang={isFr?"fr":"en"}/>;
  if(local==="industries") return <BuyerPage kind="industries" lang={isFr?"fr":"en"}/>;
  if(parts.length===2&&parts[0]==="dispensers"&&models.some(m=>m.slug===parts[1])) return <BuyerPage kind="model" slug={parts[1]} lang={isFr?"fr":"en"}/>;
  if(parts.length===2&&parts[0]==="industries"&&industries.some(m=>m.slug===parts[1])) return <BuyerPage kind="industry" slug={parts[1]} lang={isFr?"fr":"en"}/>;
  if(isFr)return <FrenchPage path={local}/>;
  if(path==="products") return <ProductsPage/>;
  if(path==="about") return <AboutPage/>;
  if(path==="order") return <OrderPage/>;
  if(path==="locations") return <LocationsPage/>;
  if(path==="clients-that-use-our-wipe-stands") return <ClientsPage/>;
  if(path==="blog") return <BlogPage/>;
  if(slug[0]==="products"&&slug[1]&&slug[1] in productDetails) return <ProductPage productKey={slug[1] as keyof typeof productDetails}/>;
  if(slug[0]==="locations"&&slug[1]){const city=cityBySlug.get(slug[1]); if(city) return <CityPage city={city}/>;}
  if(slug[0]==="blog"&&slug[1]&&slug[1] in articles) return <ArticlePage slug={slug[1] as keyof typeof articles}/>;
  notFound();
}

export async function generateMetadata({params}:RouteProps):Promise<Metadata>{
 const {slug}=await params;const fr=slug[0]==="fr",parts=fr?slug.slice(1):slug,path=parts.join("/");if(parts.length>2)notFound();
 const m=parts[0]==="dispensers"?models.find(m=>m.slug===parts[1]):undefined;
 const i=parts[0]==="industries"?industries.find(i=>i.slug===parts[1]):undefined;
 const lang=fr?"fr":"en";
 const custom=m?{title:`${m.name} — ${fr?"distributeur de lingettes":"Commercial Wipe Dispenser"}`,description:m[lang].intro}:i?{title:i[lang].title,description:i[lang].intro}:path==="compare"?{title:fr?"Comparer les distributeurs de lingettes":"Compare Commercial Wipe Dispensers",description:fr?"Comparez les sept modèles WipeAway, leurs profils et les points à vérifier avant de commander.":"Compare seven WipeAway dispenser profiles, placement considerations and refill compatibility checks before requesting pricing."}:path==="industries"?{title:fr?"Stations de lingettes par secteur":"Commercial Wipe Stations by Industry",description:fr?"Planifiez des stations pour les bureaux, commerces, hôtels, gestionnaires immobiliers et centres de conditionnement physique.":"Plan wipe stations for offices, gyms, property management, hospitality and retail facilities."}:undefined;
 const result=custom||(fr?frenchMeta(path):await englishMetadata({params:Promise.resolve({slug:parts})}));
 const en=path?`/${path}/`:"/",french=path?`/fr/${path}/`:"/fr/";
 return {...result,alternates:{canonical:fr?french:en,languages:{"en-CA":en,"fr-CA":french,"x-default":en}},openGraph:{title:typeof result?.title==="string"?result.title:undefined,description:result?.description||undefined,locale:fr?"fr_CA":"en_CA",alternateLocale:fr?"en_CA":"fr_CA",url:fr?french:en}};
}
