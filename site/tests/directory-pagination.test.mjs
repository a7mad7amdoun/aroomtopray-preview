import test from 'node:test';
import assert from 'node:assert/strict';
import { pageWindow, readPage, writePage } from '../src/lib/directory-pagination.js';
test('directory paging keeps every matching result reachable and clamps after filtering',()=>{
 const entries=Array.from({length:29},(_,i)=>i);
 assert.deepEqual([1,2,3].flatMap(page=>pageWindow(entries,page).items),entries);
 assert.deepEqual(pageWindow(entries.slice(0,3),3),{page:1,totalPages:1,items:[0,1,2]});
 assert.deepEqual(pageWindow([],3),{page:1,totalPages:1,items:[]});
});
test('page history retains filters and rejects malformed page values',()=>{
 for(const value of ['-1','Infinity','NaN','1.2','99999999','abc'])assert.equal(readPage('?page='+value),1);
 const query=writePage(3,'q=London&f=wudu&mode=map');
 assert.equal(readPage(query),3);assert.equal(new URLSearchParams(query).get('q'),'London');
 assert.equal(new URLSearchParams(writePage(1,query)).has('page'),false);
});
