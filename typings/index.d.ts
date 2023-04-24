export type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];
export type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
export type NonFunctionPropertyNamesNumber<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
export type PartialPick<T, M extends keyof T> = Partial<Pick<T, M>>
export type FunctionProperties<T> = PartialPick<T, FunctionPropertyNames<T>>;
export type NonFunctionProperties<T> = PartialPick<T, NonFunctionPropertyNames<T>>;
export type NonFunctionPropertiesNumber<T> = Modify<NonFunctionProperties<T>, { [K in keyof NonFunctionProperties<T>]: number }>
export type NonFunctionPropertiesString<T> = Modify<NonFunctionProperties<T>, { [K in keyof NonFunctionProperties<T>]: string }>
export type NonFunctionPropertiesBoolean<T> = Modify<NonFunctionProperties<T>, { [K in keyof NonFunctionProperties<T>]: boolean }>
export type Modify<T, R> = Partial<Pick<T, Exclude<keyof T, keyof R>> & R>
import Stack from '../server/models/stack'
import _GlobalScripts from '../modules/global-scripts/GlobalScripts'
export type StackFile = Stack.StackFile
export type StackArray = Stack.StackArray
export type StackMonitor = typeof Stack
export type TrackStep = _GlobalScripts.TrackStep
export type GlobalScript = _GlobalScripts.GlobalScript
