---
outline: deep
---
# Git

## On each service

### Requirements
To have fully functional git. You must have:
 - [rootPath option](../reference/service-options.md#root-path) specified.
 - [git home option](../reference/service-options.md#home) specified.
 - [git remote option](../reference/service-options.md#remote) specified.
 - And have ```.git``` in rootPath

### Features

 - View branches
 - Fetch: every 60seconds a fetch is performed but it can force via the reload button
 - Show status
 - Checkout file
 - Change Branch
 - Stash/Unstash
 - Reset
 - Display/find history for current branch
 - Display/find history global
 - Open a file in vscode

## API

You can interact with your repositories directly by stackMonitor object under git namespace. You should have a stack file in [extended version](../reference/extended-options.md)

### git.changeBranch
```js Type
stackMonitor
  .git
  .changeBranch(serviceName: string, branchName: string) => Promise<'ok'> 
```

### git.checkoutFile
```js Type
stackMonitor
  .git
  .checkoutFile(serviceName: string, filePath: string) => Promise<'ok'> 
```
### git.deleteBranch
```js Type
stackMonitor
  .git
  .deleteBranch(serviceName: string, branchName: string) => Promise<'ok'> 
```
### git.fetch
```js Type
stackMonitor
  .git
  .fetch(serviceName: string) => Promise<'ok'> 
```
### git.getBranches
```js Type
stackMonitor
  .git
  .getBranches(serviceName: string) => Promise<{
    name: string;
    merged: boolean;
  }[]>
```
### git.getCurrentBranch
```js Type
stackMonitor
  .git
  .getCurrentBranch(serviceName: string): Promise<string>
```
### git.getDiff
Return all current diff
```js Type
stackMonitor
  .git
  .getDiff(serviceName: string): Promise<string>
```
### git.getGraph
Return each lines of commit history
```js Type
stackMonitor
  .git
  .getGraph(serviceName: string, { graphOnAll }?: {
    graphOnAll?: boolean;
  }): Promise<string[]>
```
### git.getStatus
```js Type
stackMonitor
  .git
  .getStatus(serviceName: string): Promise<string[]>
```
### git.push
```js Type
stackMonitor
  .git
  .push(serviceName: string): Promise<'ok'>
```
### git.pull
```js Type
stackMonitor
  .git
  .pull(serviceName: string): Promise<'ok'>
```
### git.remoteDelta
```js Type
stackMonitor
  .git
  .remoteDelta(serviceName: string, branchName: string): Promise<number>
```
### git.reset
```js Type
stackMonitor
  .git
  .reset(serviceName: string): Promise<'ok'>
```
### git.stash
```js Type
stackMonitor
  .git
  .stash(serviceName: string): Promise<'ok'>
```
### git.stashList
```js Type
stackMonitor
  .git
  .stashList(serviceName: string): Promise<string>
```
### git.stashPop
```js Type
stackMonitor
  .git
  .stashPop(serviceName: string): Promise<'ok'>
```