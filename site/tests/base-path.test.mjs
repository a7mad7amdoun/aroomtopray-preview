import test from 'node:test';
import assert from 'node:assert/strict';
import { withBase, withoutBase } from '../src/lib/base-path.js';
test('review URLs mount exactly once, retain query/hash and leave external URLs alone',()=>{
 const base='/aroomtopray-preview';
 assert.equal(withBase('/fr/airports/lhr/?browse=q%3DLondon#rooms',base),base+'/fr/airports/lhr/?browse=q%3DLondon#rooms');
 assert.equal(withBase(base+'/saved/',base),base+'/saved/');
 assert.equal(withoutBase(base+'/ar/hospitals/',base),'/ar/hospitals/');
 assert.equal(withoutBase('/aroomtopray-preview-other/airports/',base),'/aroomtopray-preview-other/airports/');
 for(const path of ['https://example.com/','//example.com/','#rooms']) assert.equal(withBase(path,base),path);
 assert.equal(withBase('/airports/',''),'/airports/');
});
