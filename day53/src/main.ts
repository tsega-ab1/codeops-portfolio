// Scratch file: imports ONLY through the barrel (./orders), never past it
import {
  InMemoryOrderRepository,
  OrderNotFoundError,
  OrderService,
} from "./orders";
import { seedOrders } from "./seed-orders";

const service = new OrderService(new InMemoryOrderRepository(seedOrders));

console.log("Order 5:", service.find(5));

try {
  service.find(999);
} catch (error) {
  // a caught value is `unknown`, so narrow it before using it
  if (error instanceof OrderNotFoundError) {
    console.log(`Not found: id ${error.orderId} ->`, error.message);
  } else {
    throw error;
  }
}

console.log("Fees by area:", service.feesByArea());

const names: string[] = service.summarise("customer"); // string[], not any[]
console.log("Customers:", names);
console.log("Statuses:", service.summarise("status"));
