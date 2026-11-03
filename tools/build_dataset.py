"""Builds server/src/data/a2zSheet.json + verificationReport.json.

Inputs (in this folder):
  raw.tsv          snapshot of the reference sheet (layout, topic > subtopic, id, slug, title, level, LeetCode link)
  gfg_catalog.tsv  GFG practice catalog: title<TAB>slug<TAB>difficulty   (not committed; re-export to rebuild)
  lc_catalog.tsv   LeetCode catalog: slug<TAB>title<TAB>difficulty<TAB>paid (not committed; re-export to rebuild)
Run:  python3 build_dataset.py
"""
import re, json, collections, datetime, os
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', 'server', 'src', 'data')
os.chdir(HERE)
norm=lambda s: re.sub(r'[^a-z0-9]','',s.lower().replace('&','and'))
# Reviewed fuzzy GFG matches (TUF id -> GFG slug), each checked by hand as the same problem
MANUAL={370:'all-divisors-of-a-number',342:'reverse-an-array',394:'largest-odd-number-in-string',944:'insertion-sort',945:'merge-sort',946:'quick-sort',46:'move-all-zeroes-to-end-of-array0751',47:'remove-duplicate-elements-from-sorted-array',48:'union-of-two-sorted-arrays-1587115621',22:'majority-element-1587115620',911:'set-matrix-zeroes',26:'count-reverse-pairs',24:'maximum-product-subarray3604',605:'largest-subarray-with-0-sum',561:'subarray-range-with-given-sum2804',562:'count-subarray-with-given-xor',89:'search-insert-position-of-k-in-a-sorted-array',87:'search-in-a-rotated-array4618',88:'search-in-rotated-array-2',229:'number-of-occurrence2259',600:'kth-missing-positive-number-in-a-sorted-array',805:'the-painters-partition-problem1535',78:'minimize-max-distance-to-gas-station',993:'sum-of-beauty-of-all-substrings-1662962118',879:'check-if-there-exists-a-subsequence-with-sum-k',329:'palindromic-patitioning4845',625:'add-two-numbers-represented-by-linked-lists',629:'given-a-linked-list-of-0s-1s-and-2s-sort-it',448:'finding-middle-element-in-a-linked-list',613:'merge-two-sorted-linked-lists',609:'delete-all-occurrences-of-a-given-key-in-a-doubly-linked-list',610:'remove-duplicates-from-a-sorted-doubly-linked-list',19363:'set-the-rightmost-unset-bit4436',922:'maximum-point-you-can-obtain-from-cards',988:'subarrays-with-k-different-integers',923:'binary-subarray-with-sum',390:'implement-stack-using-array',391:'implement-stack-using-linked-list',388:'implement-queue-using-linked-list',185:'children-sum-parent',116:'boundary-traversal-of-binary-tree',125:'print-a-binary-tree-in-vertical-order',110:'construct-tree-1',112:'serialize-and-deserialize-a-binary-tree',569:'merge-k-sorted-linked-lists',520:'implementing-dijkstra-set-1-adjacency-matrix',527:'shortest-path-in-a-binary-maze-1655453161',511:'account-merge',496:'articulation-point2616',318:'perfect-sum-problem5633',317:'partitions-with-given-difference',851:'printing-longest-increasing-subsequence',780:'number-of-longest-increasing-subsequence',312:'form-a-palindrome2544',314:'wildcard-pattern-matching',1025:'maximum-xor-with-an-element-from-array'}
# Exact-title matches rejected on review (ambiguous: >1 GFG problem with this title)
REJECT_EXACT={45}
G={}; Gname=collections.defaultdict(list)
for l in open('gfg_catalog.tsv'):
    n,s,d=l.rstrip('\n').split('\t'); G[s]=(n,d); Gname[norm(n)].append(s)
LC={}
for l in open('lc_catalog.tsv'):
    s,t,d,p=l.rstrip('\n').split('\t'); LC[s]=(t,d,p=='1')
rows=[l.split('\t') for l in open('raw.tsv').read().split('\n')]
modules=[]; problems=[]; unverified=[]; excluded=[]
mod_index={}; sub_index={}
order=0
for r in rows:
    layout,path,tid,slug,label,diff,lc=r
    mod,sub=[x.strip() for x in path.split(' > ')]
    if mod not in mod_index:
        mod_index[mod]=len(modules); modules.append({'step':len(modules)+1,'name':mod,'slug':re.sub(r'[^a-z0-9]+','-',mod.lower()).strip('-'),'subtopics':[]})
    M=modules[mod_index[mod]]
    if layout!='practice':
        excluded.append({'title':label.strip(),'topic':mod,'subtopic':sub,'reason':'lesson/article (not a problem)'}); continue
    key=(mod,sub)
    if key not in sub_index:
        sub_index[key]=len(M['subtopics']); M['subtopics'].append({'name':sub,'order':len(M['subtopics'])+1})
    order+=1; tid=int(tid); title=re.sub(r'\s+',' ',label).strip()
    p={'id':f'a2z-{tid}','sourceId':tid,'title':title,'slug':slug.strip('-'),'step':M['step'],'topic':mod,'subtopic':sub,
       'subtopicOrder':sub_index[key]+1,'order':order,'difficulty':{'basic':'Basic','core':'Core','pro':'Pro'}.get(diff),
       'leetcode':None,'gfg':None,'sourceUrl':'https://takeuforward.org/prep-hub/strivers-a2z-dsa-sheet?page=sheet'}
    USER_LC={45:'https://leetcode.com/problems/intersection-of-two-arrays/'}  # links supplied by the project owner
    if tid in USER_LC and not lc: lc=USER_LC[int(tid)]
    if lc:
        url=lc.split('#')[0]
        m=re.fullmatch(r'https://leetcode\.com/problems/([a-z0-9-]+)/?',url)
        RENAMED={'implement-strstr':'find-the-index-of-the-first-occurrence-in-a-string'}
        s=RENAMED.get(m.group(1),m.group(1)) if m else None
        if s in LC:
            t,d,prem=LC[s]
            p['leetcode']={'url':f'https://leetcode.com/problems/{s}/','slug':s,'title':t,'difficulty':d,'premium':prem,'verification':'user-supplied+catalog' if tid in USER_LC else 'reference-sheet+catalog'}
        else:
            unverified.append({'id':p['id'],'title':title,'platform':'leetcode','reason':'reference link is not a LeetCode problem page' if not m else 'slug not found in LeetCode catalog','rawUrl':lc})
    gs=None; how=None
    if tid in MANUAL: gs=MANUAL[tid]; how='manual-review'
    elif tid not in REJECT_EXACT and len(Gname.get(norm(title),[]))==1: gs=Gname[norm(title)][0]; how='exact-title'
    elif len(Gname.get(norm(title),[]))>1: unverified.append({'id':p['id'],'title':title,'platform':'gfg','reason':'multiple GFG problems share this title'})
    if gs:
        assert gs in G, gs
        n,d=G[gs]; p['gfg']={'url':f'https://www.geeksforgeeks.org/problems/{gs}/1','slug':gs,'title':n,'difficulty':d,'verification':how}
    plats=[x for x in ('leetcode','gfg') if p[x]]
    p['platformAvailability']=plats
    problems.append(p)
for M in modules:
    M['problemCount']=sum(1 for p in problems if p['step']==M['step'])
modules=[M for M in modules if M['problemCount']>0]
meta={'name':"Striver's A2Z DSA Sheet (problem list)",'source':'https://takeuforward.org/prep-hub/strivers-a2z-dsa-sheet?page=sheet','snapshotDate':datetime.date.today().isoformat(),
      'totals':{'problems':len(problems),'withLeetcode':sum(1 for p in problems if p['leetcode']),'withGfg':sum(1 for p in problems if p['gfg']),'noPlatformLink':sum(1 for p in problems if not p['platformAvailability']),'excludedLessons':len(excluded)},
      'notes':['Structure, ordering, titles and Basic/Core/Pro levels were read from the reference sheet.','LeetCode links come from the reference sheet and were checked against the LeetCode problem catalog (slug exists).','The reference sheet lists no GFG links; GFG links were matched against the GFG practice catalog (exact title, or hand-reviewed close match). Problems without a confident match have no GFG link.']}
json.dump({'meta':meta,'topics':modules,'problems':problems},open(os.path.join(DATA,'a2zSheet.json'),'w'),indent=1,ensure_ascii=False)
json.dump({'unverified':unverified,'excludedLessons':excluded},open(os.path.join(DATA,'verificationReport.json'),'w'),indent=1,ensure_ascii=False)
print(json.dumps(meta['totals'])); print(len(modules),'topics'); print(unverified)
