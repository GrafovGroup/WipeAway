import Link from "next/link";
import { PageFrame } from "./site-shell";
export default function NotFound(){return <PageFrame><main id="main-content"><section className="contact-hero"><div className="shell"><p className="eyebrow">404 • PAGE NOT FOUND</p><h1>That page has moved.</h1><p>Explore WipeAway products, locations and commercial facility resources from the links below.</p><div className="hero-actions"><Link className="button button-blue" href="/">GO TO HOMEPAGE</Link><Link className="button button-white" href="/order">REQUEST PRICING</Link></div></div></section></main></PageFrame>}
