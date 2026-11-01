import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
test('workflows parse and feature validation cannot deploy',()=>{
 const deploy=parse(readFileSync('.github/workflows/deploy.yml','utf8'));
 assert.deepEqual(deploy.on.push.branches,['main']);
 assert.equal(deploy.jobs.build.if,"github.ref == 'refs/heads/main'");
 assert.equal(deploy.jobs.deploy.if,"github.ref == 'refs/heads/main'");
 const qa=parse(readFileSync('.github/workflows/seo.yml','utf8'));
 assert('pull_request' in qa.on);assert(!('deploy' in qa.jobs));assert.equal(qa.permissions.contents,'read');
 for(const workflow of [qa,deploy]) {
  const job=workflow.jobs.validate || workflow.jobs.build;
  for(const command of ['npm ci','npm test','npm run build','npm run check:seo','npm run test:browser','npm run test:consent']) assert(job.steps.some(step=>step.run===command),command);
 }
});
