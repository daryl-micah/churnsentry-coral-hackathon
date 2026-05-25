export type DemoStripeEvent = {
  eventId: string;
  customerId: string;
};

export function runDemoEvent(): DemoStripeEvent {
  // TODO: return a simulated Stripe webhook event
  return { eventId: "evt_demo", customerId: "cus_demo" };
}
