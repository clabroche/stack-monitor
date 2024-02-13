// @ts-ignore
const port = import.meta.env?.VITE_HTTP_PORT;
const baseURL = port ? `http://localhost:${port}` : '/';

export default {
  port,
  baseURL,
};
