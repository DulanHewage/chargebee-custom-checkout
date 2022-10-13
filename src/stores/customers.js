import { defineStore } from "pinia";
import { reactive } from "vue";

export const useCustomerStore = defineStore("customers", () => {
  const customers = reactive([]);

  function setCustomer(customer) {
    customers.push(customer);
  }

  return { customers, setCustomer };
});
