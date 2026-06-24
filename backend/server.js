const express=require("express");
const cors=require("cors");
const app=express();
app.use(cors());
app.use(express.json());

function buildTree(root, adj){
  const make=(n)=>{
    let obj={};
    for(const c of (adj[n]||[])) obj[c]=make(c);
    return obj;
  };
  return {[root]:make(root)};
}
function depth(node,adj){
  let kids=adj[node]||[];
  if(!kids.length) return 1;
  return 1+Math.max(...kids.map(k=>depth(k,adj)));
}

app.post("/bfhl",(req,res)=>{
  const data=req.body.data||[];
  const invalid_entries=[];
  const duplicate_edges=[];
  const seen=new Set();
  const dupSeen=new Set();
  const edges=[];
  const childParent={};

  for(let item of data){
    item=(item||"").trim();
    if(!/^[A-Z]->[A-Z]$/.test(item) || item[0]===item[3]){
      invalid_entries.push(item);
      continue;
    }
    if(seen.has(item)){
      if(!dupSeen.has(item)){ duplicate_edges.push(item); dupSeen.add(item);}
      continue;
    }
    seen.add(item);
    const [p,c]=item.split("->");
    if(childParent[c]) continue;
    childParent[c]=p;
    edges.push([p,c]);
  }

  const nodes=new Set(), adj={};
  edges.forEach(([p,c])=>{
    nodes.add(p); nodes.add(c);
    adj[p]=adj[p]||[];
    adj[p].push(c);
  });

  const visited=new Set();
  const hierarchies=[];
  let totalTrees=0,totalCycles=0,largestRoot="",largestDepth=0;

  for(const node of nodes){
    if(visited.has(node)) continue;
    const comp=new Set();
    const stack=[node];
    while(stack.length){
      const cur=stack.pop();
      if(comp.has(cur)) continue;
      comp.add(cur);
      visited.add(cur);
      for(const [p,c] of edges){
        if(p===cur && !comp.has(c)) stack.push(c);
        if(c===cur && !comp.has(p)) stack.push(p);
      }
    }

    let hasCycle=false;
    const compNodes=[...comp];
    const state={};
    const dfs=(n)=>{
      state[n]=1;
      for(const k of (adj[n]||[])){
        if(!comp.has(k)) continue;
        if(state[k]===1) return true;
        if(!state[k] && dfs(k)) return true;
      }
      state[n]=2; return false;
    };
    for(const n of compNodes){ if(!state[n] && dfs(n)){ hasCycle=true; break;}}

    const children=new Set();
    edges.forEach(([p,c])=>{ if(comp.has(p)&&comp.has(c)) children.add(c);});
    let roots=compNodes.filter(n=>!children.has(n));
    let root=roots.length?roots.sort()[0]:compNodes.sort()[0];

    if(hasCycle){
      totalCycles++;
      hierarchies.push({root,tree:{},has_cycle:true});
    }else{
      const d=depth(root,adj);
      totalTrees++;
      if(d>largestDepth || (d===largestDepth && (largestRoot==="" || root<largestRoot))){
        largestDepth=d; largestRoot=root;
      }
      hierarchies.push({root,tree:buildTree(root,adj),depth:d});
    }
  }

  res.json({
    user_id: "manshika_28012005",
    email_id: "manshika0732.be23@chitkara.edu.in",
    college_roll_number: "2310990732",
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary:{
      total_trees:totalTrees,
      total_cycles:totalCycles,
      largest_tree_root:largestRoot
    }
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
