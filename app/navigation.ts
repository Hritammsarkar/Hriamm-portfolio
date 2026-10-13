export type PortfolioPage="home"|"about"|"projects"|"skills"|"certificates"|"resume"|"contact";
export const navigation:Array<{name:string;page:PortfolioPage;href:string}>=[
  {name:"Home",page:"home",href:"/"},
  {name:"Work",page:"projects",href:"/projects"},
  {name:"Skills",page:"skills",href:"/skills"},
  {name:"Certificates",page:"certificates",href:"/certificates"},
  {name:"Resume",page:"resume",href:"/resume"},
  {name:"About",page:"about",href:"/about"},
  {name:"Contact",page:"contact",href:"/contact"}
];
