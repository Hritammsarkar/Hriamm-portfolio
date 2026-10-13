import {notFound} from "next/navigation";
import Portfolio from "../portfolio";
import {type PortfolioPage,navigation} from "../navigation";
import {initialContent} from "../content";
import {readContent} from "../storage";
export const dynamic="force-dynamic";
type Props={params:Promise<{section:string}>};
export async function generateMetadata({params}:Props){
  const {section}=await params;
  const item=navigation.find(p=>p.page===section&&p.page!=="home");
  return {title:item?item.name+" | Hritamm Sarkar":"Page not found | Hritamm Sarkar"};
}
export default async function PortfolioRoute({params}:Props){
  const {section}=await params;
  if(!navigation.some(item=>item.page===section&&item.page!=="home"))notFound();
  let content=initialContent;
  try{content=(await readContent()).content}catch(e){console.error("Portfolio storage unavailable",e)}
  return <Portfolio content={content} page={section as PortfolioPage}/>;
}
