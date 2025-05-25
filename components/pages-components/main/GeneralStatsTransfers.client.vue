<template lang="pug">
.col.col-md-6
  main-banner(
    :isShowed="isLoaded"
    header="Amount of BNB entered to the system"
    link=true
    :footer="totalAmountBnb + ' BNB'"
  )
.col.col-md-3
  main-banner(
    :isShowed="isLoaded"
    header="BTC equivalent of sent BNB that entered to the system"
    :footer="totalAmountBtc + ' BTC'"
  )
</template>

<script setup>
import MainBanner from "~/components/pages-components/main/MainBanner.vue";
import { getBC } from "~/stores/useWeb3.js";
import { isClient } from "@vueuse/core";

let BC;

useNuxtApp().$on("initialized", async () => {
  await getTotalAccounts();
});

useNuxtApp().$on("wallet-updated", async () => {
  await getTotalAccounts();
});

const totalAmountBnb = ref(0);
const totalAmountBtc = ref(0);
const isLoaded = ref(false);
const getTotalAccounts = async () => {
  if (!isClient) return;
  BC = getBC();
  if (BC && BC.value) {
    const totalWei = await BC.value.getTotalDeposited();
    totalAmountBnb.value = Number(totalWei) / 10 ** 18;
    const rate = await getBtcRate();
    totalAmountBtc.value = (totalAmountBnb.value / rate).toFixed(8);
  }
  isLoaded.value = true;
};

const getBtcRate = async () => {
  // btc $58961
  // bnb $521
  return new Promise((resolve) => {
    resolve(113);
  });

  // todo -- https://www.okx.com/docs-v5/trick_en/#order-management-pagination
  // try {
  //   const response = await axios.get('https://api.coinmarketcap.com/v1/ticker/ethereum/?convert=USD', {
  //     headers: {
  //       'X-CMC_PRO_API_KEY': '8f350504-8864-4aaa-8666-778c3bc28dbf',
  //     },
  //   })
  //   console.info('response')
  //   console.log(response)
  //
  // } catch(e) {
  //
  //   // TODO: fix cors error
  //
  //   console.warn('E')
  //   console.warn(e)
  // }

  // const axios = require('axios');
  // let data = JSON.stringify({
  //   "symbols": "ETH/USD,BTC/USD"
  // });
  // let config = {
  //   method: 'post',
  //   maxBodyLength: Infinity,
  //   url: 'https://oracle.binance.com/api/gw/symbol-price',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Accept': 'application/json'
  //   },
  //   data : data
  // };
  // axios(config)
  //     .then((response) => {
  //       console.log(JSON.stringify(response.data));
  //     })
  //     .catch((error) => {
  //       console.log(error);
  //     });
};

// Добавьте функцию для проверки всех типов событий
const checkAllEventTypes = async () => {
  if (!isClient) return;
  BC = getBC();
  if (BC && BC.value) {
    console.log("=== CHECKING ALL EVENT TYPES ===");

    // Импортируем EventMap из файла abi-events.js
    const { EventMap } = await import("~/libs/events-infura/abi-events.js");

    // Перебираем все типы событий
    for (const eventType in EventMap) {
      console.log(`\n=== Checking events of type: ${eventType} ===`);
      const events = await GetEvents(eventType);
      console.log(`Total ${eventType} events:`, events.length);

      // Если есть события, проверяем их структуру
      if (events && events.length > 0) {
        console.log(
          `First ${eventType} event structure:`,
          Object.keys(events[0])
        );

        // Проверяем, есть ли в событиях поле amount
        if ("amount" in events[0]) {
          console.log(`Found amount field in ${eventType}!`);

          // Выводим все суммы
          events.forEach((event, index) => {
            const amountInBnb = Number(event.amount) / 10 ** 18;
            // Отмечаем особо интересующие нас суммы по 0.01 BNB
            const marker = amountInBnb === 0.01 ? " <-- FOUND 0.01 BNB!" : "";
            console.log(
              `${eventType} ${index} amount:`,
              amountInBnb,
              "BNB",
              marker
            );
          });

          // Считаем общую сумму
          const totalAmount = events.reduce(
            (acc, curr) => acc + Number(curr.amount),
            0
          );
          console.log(
            `Total amount in ${eventType}:`,
            totalAmount / 10 ** 18,
            "BNB"
          );
        } else {
          // Если нет поля amount, показываем пример события для анализа
          console.log(
            `${eventType} does not have an amount field. Sample event:`,
            events[0]
          );
        }
      }
    }

    console.log("=== ALL EVENT TYPES CHECKED ===");
  }
};

// Вызовите эту функцию при загрузке компонента
onMounted(async () => {
  await checkAllEventTypes();
});

// Или добавьте кнопку для запуска проверки
// <button @click="checkAllEventTypes">Check All Event Types</button>
</script>
