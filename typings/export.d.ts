
//===== Root Types ==========
export type {
  StackFile,
  StackArray,
  StackObject,
  StackFunction,
  Environment,
  StackWithPlugins
} from "../server/models/stack";

export type {
  SpawnOptions,
  ServiceType as Service
} from "../server/models/Service";

//===== Global Scripts ==========
import type {
  GlobalScript as _Script,
  ScriptStep as _ScriptStep,
  TrackStep as _TrackStep
} from "../modules/global-scripts/GlobalScripts";
export namespace GlobalScripts  {
  export type Script = _Script
  export type ScriptStep = _ScriptStep
  export type TrackStep = _TrackStep
}

//===== Plugins ==========
import type {
  PluginSM as _StackMonitorPlugin
} from "../modules/views";
export namespace Plugins  {
  export type StackMonitorPlugin<T> = _StackMonitorPlugin<T>
}

//===== Leaf ==========
import type {
  Leaf as _Leaf
} from "../modules/documentation/index";
export namespace Documentation  {
  export type Leaf = _Leaf
}

//===== Npm ==========
import type {
  Outdated as _Outdated
} from "../modules/npm/index";
export namespace Npm  {
  export type Outdated = _Outdated
}

//===== Npm ==========
import type {
  OpenAiChat as _OpenAiChat
} from "../modules/openai";
export namespace OpenAi  {
  export type OpenAiChat = _OpenAiChat
}

//===== Fs ==========
import type {
Entry as _Entry,
NpmInfos as _NpmInfos
} from "../server/routes/fs";
export namespace FS  {
  export type Entry = _Entry
  export type NpmInfos = _NpmInfos
}