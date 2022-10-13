<template>
  <div class="customer">
    <div class="text"><span class="label">Full Name:</span> {{ fullName }}</div>
    <div class="text"><span class="label">ID:</span> {{ customer.id }}</div>
    <div class="text">
      <span class="label">Email: </span>{{ customer.email }}
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  customer: {
    type: Object,
    required: true,
  },
});

const fullName = computed(() => {
  if (props.customer.first_name && props.customer.last_name) {
    return `${props.customer.first} ${props.customer.last_name}`;
  } else {
    return "name missing";
  }
});
</script>

<style lang="scss" scoped>
.customer {
  padding: 20px 40px;
  background-color: #fff;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border-radius: 6px;
  font-size: 1.25rem;
  color: #212529;
  border: 1px #212529 solid;
  margin-bottom: 10px;
  &:last-child {
    margin-bottom: 0;
  }

  .label {
    font-weight: 600;
  }
}
</style>
