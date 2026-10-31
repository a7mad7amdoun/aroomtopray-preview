import test from 'node:test';
import assert from 'node:assert/strict';
import {tabIndexForKey,panelIndexForTarget} from '../src/lib/guide-navigation.js';

test('tab navigation wraps and respects Arabic reading direction without trapping other keys',()=>{
 assert.equal(tabIndexForKey('ArrowRight',2,3),0);
 assert.equal(tabIndexForKey('ArrowLeft',0,3),2);
 assert.equal(tabIndexForKey('ArrowRight',0,3,true),2);
 assert.equal(tabIndexForKey('ArrowLeft',2,3,true),0);
 assert.equal(tabIndexForKey('Home',2,3,true),0);
 assert.equal(tabIndexForKey('End',0,3),2);
 for(const key of ['Tab','Escape','a','ArrowDown'])assert.equal(tabIndexForKey(key,0,3),null);
});

test('links to a room, compass or report reveal the containing information panel',()=>{
 const room={},compass={},report={},outside={};
 const panels=[{contains:target=>target===room},{contains:target=>target===compass},{contains:target=>target===report}];
 assert.equal(panelIndexForTarget(panels,room),0);
 assert.equal(panelIndexForTarget(panels,compass),1);
 assert.equal(panelIndexForTarget(panels,report),2);
 assert.equal(panelIndexForTarget(panels,panels[1]),1);
 assert.equal(panelIndexForTarget(panels,outside),-1);
 assert.equal(panelIndexForTarget(panels,null),-1);
});
