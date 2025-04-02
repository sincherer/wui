export * from "@chaibuilder/runtime";

if (import.meta.env.PROD) {
  console.log('Disabling mock service worker in production');
  const { worker } = await import('../public/mockServiceWorker');
  worker.stop();
}