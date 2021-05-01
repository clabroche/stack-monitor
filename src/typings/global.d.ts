declare module "*.png" {
  const value: string;
  export default value;
}
declare module "*.svg" {
  const value: string;
  export default value;
}
declare module "*.vue" {
  const value: import('vue').Component;
  export default value;
}
