export type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];
export type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
export type NonFunctionPropertyNamesNumber<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
export type PartialPick<T,M> = Partial<Pick<T, M>>
export type FunctionProperties<T> = PartialPick<T, FunctionPropertyNames<T>>;
export type NonFunctionProperties<T> = PartialPick<T, NonFunctionPropertyNames<T>>;
export type NonFunctionPropertiesNumber<T> = Modify<NonFunctionProperties<T>, {[K in keyof NonFunctionProperties<T>]: number}>
export type NonFunctionPropertiesString<T> = Modify<NonFunctionProperties<T>, {[K in keyof NonFunctionProperties<T>]: string}>
export type NonFunctionPropertiesBoolean<T> = Modify<NonFunctionProperties<T>, {[K in keyof NonFunctionProperties<T>]: boolean}>
export type Modify<T, R> = Partial<Pick<T, Exclude<keyof T, keyof R,keyof S>> & R>
export type ToType<T> = NonFunctionProperties<T>;

export interface FieldDescriptior {
  field: string,
  type: 'string' | 'number' | 'boolean' | 'objectId'
}
type validation = (value: any, path: string) => {
  isValid: boolean,
  message: string
}
type validationFactory = (...args: any) => validation

export type GenericFields<M> = {
  default:  M = M
  validation?: validation
  hasMany?: string
  hasOne?: string,
  doc?: string
}
export type SchemaField = GenericFields<String> | GenericFields<Number>| GenericFields<any>
export type Generic = {
  [key: string]: SchemaField
}

type GeneratedClass<T, D, E> = {
  new(schema: SchemaTransformed<T>): Instance<T,Partial<D>>;
  find: (filter: {filter: SchemaTransformed<T>, limit?: number, skip?: number, sort?: any, lookups?: any}) => Promise<Instance<T>[]>
  findOne: (filter: {filter: SchemaTransformed<T>, limit?: number, skip?: number, sort?: any, lookups?: any}) => Promise<Instance<T>>
  update: (filter: Instance<T>) => Promise<Instance<T>>
  updateMany: (filter: SchemaTransformed<T>, set: SchemaTransformed<T>) => void
  schema: T
  schemaName: string
} & Partial<E> & {[key: string]: any}
type SchemaTransformed<M> = {
  [K in keyof M]?: M[K]['default']
}
type Instance<M, D> = SchemaTransformed<M> &  {
  save: () => Promise<Instance<M>>
} & D
interface Option<C, D, E> {
  mongo?: any,
  description?: string
  extends?: C
  routes?: {
    prefix: string,
    paths: {
      
    } 
  }
  docs?: {
    methods: {
      [key: string]: {
        description?: string,
        params?: {
          label: string,
          type?: any,
          description?: string
        }
      }
    }
  }
  methods?: D,
  staticMethods?: E,
}
type CustomFunctions<M> = {[key: string]: (this: M,...args: any) => any}
export interface Schema {
  createSchema<M extends Generic ,C extends  Generic, D extends CustomFunctions<Instance<M & C,Partial<D>>>, E extends CustomFunctions<F>, F extends GeneratedClass<M & C, D, E>>(name: string, schema: M, option?: Option<C, D, E>): F
}
export type AnyObject<T = string> = Record<T, any>;


// export type FunctionPropertyNames<T> = {
//   [K in keyof T]: T[K] extends Function ? K : never;
// }[keyof T];
// export type NonFunctionPropertyNames<T> = {
//   [K in keyof T]: T[K] extends Function ? never : K;
// }[keyof T];
// export type NonFunctionPropertyNamesNumber<T> = {
//   [K in keyof T]: T[K] extends Function ? never : K;
// }[keyof T];
// export type PartialPick<T, M extends keyof T> = Partial<Pick<T, M>>
// export type FunctionProperties<T> = PartialPick<T, FunctionPropertyNames<T>>;
// export type NonFunctionProperties<T> = PartialPick<T, NonFunctionPropertyNames<T>>;
// export type NonFunctionPropertiesNumber<T> = Modify<NonFunctionProperties<T>, { [K in keyof NonFunctionProperties<T>]: number }>
// export type NonFunctionPropertiesString<T> = Modify<NonFunctionProperties<T>, { [K in keyof NonFunctionProperties<T>]: string }>
// export type NonFunctionPropertiesBoolean<T> = Modify<NonFunctionProperties<T>, { [K in keyof NonFunctionProperties<T>]: boolean }>
// export type Modify<T, R> = Partial<Pick<T, Exclude<keyof T, keyof R>> & R>


//= ==== Root Types ==========
//= ==== Global Scripts ==========
import type {
  GlobalScript as _Script,
  ScriptStep as _ScriptStep,
  TrackStep as _TrackStep,
} from '../../../modules/global-scripts/backend/GlobalScripts';

//= ==== Plugins ==========
import type {
  PluginSM as _StackMonitorPlugin,
} from '../../../modules/plugins-loader/front/src/views';

//= ==== Leaf ==========
import type {
  Leaf as _Leaf,
} from '../../../modules/documentation/backend/index';

//= ==== Npm ==========
import type {
  Outdated as _Outdated,
} from '../../../modules/npm/backend/index';

//= ==== Npm ==========
import type {
  OpenAiChat as _OpenAiChat,
} from '../../../modules/openai/backend';

//= ==== Fs ==========
import type {
  Entry as _Entry,
  NpmInfos as _NpmInfos,
} from '../../../servers/server/routes/fs';

export type {
  StackFile,
  StackArray,
  StackObject,
  StackFunction,
  Environment,
  StackWithPlugins as StackMonitor,
} from '../../../servers/server/models/stack';

export type {
  SpawnOptions,
  ServiceType as Service,
  LogMessage,
  Parser,
} from '../../../servers/server/models/Service';
export namespace GlobalScripts {
  export type Script = _Script
  export type ScriptStep = _ScriptStep
  export type TrackStep = _TrackStep
}
export namespace Plugins {
  export type StackMonitorPlugin<T> = _StackMonitorPlugin<T>
}
export namespace Documentation {
  export type Leaf = _Leaf
}
export namespace Npm {
  export type Outdated = _Outdated
}
export namespace OpenAi {
  export type OpenAiChat = _OpenAiChat
}

export namespace FS {
  export type Entry = _Entry
  export type NpmInfos = _NpmInfos
}
