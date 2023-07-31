import { deserialize } from 'bson';
import fetch from 'node-fetch';
import getFromUrl from './httpRequest.js';

const {
  WANTED_RATIO, WANTED_MINIMUM_NET_GAIN, AT_LEAST_X_SALES, IN_THE_LAST_X_DAYS, UNIVERSALIS_API_URL,
} = process.env;

const MS_IN_A_DAY = 86400000;

const getInfoFromAlpha = async (item, hq) => getFromUrl(`${UNIVERSALIS_API_URL}402/${item}?hq=${hq}&entries=30`);

const getInfoFromLight = async (item, hq) => getFromUrl(`${UNIVERSALIS_API_URL}light/${item}?hq=${hq}`);

const getNumberOfSalesInTheLastXDays = (recentHistory, hq) => {
  const filteredWithDates = recentHistory
    .filter((history) => history.hq === hq)
    .filter((history) => history.timestamp * 1000
    > Date.now() - (MS_IN_A_DAY * IN_THE_LAST_X_DAYS));

  const averagePrice = filteredWithDates.map((history) => history.pricePerUnit)
    .reduce((a, b) => a + b, 0) / filteredWithDates.length;
  return { number: filteredWithDates.length, averagePrice };
};

const processMessage = async (data) => {
  const message = deserialize(data);
  const [listing] = message.listings;
  const { item } = message;

  // Get the info for the item in Alpha
  const alphaInfos = await getInfoFromAlpha(item, listing.hq);
  if (!alphaInfos) return;
  const alphaPrice = alphaInfos?.listings[0]?.pricePerUnit;
  const ratio = alphaPrice / listing.pricePerUnit;
  const theoricalNetGain = alphaPrice * listing.quantity - listing.pricePerUnit * listing.quantity;
  const sales = getNumberOfSalesInTheLastXDays(alphaInfos.recentHistory, listing.hq);

  if (ratio > WANTED_RATIO && theoricalNetGain > WANTED_MINIMUM_NET_GAIN
    && sales.number >= AT_LEAST_X_SALES) {
    // Get infos on that item from the Datacenter
    const newInfo = (await getInfoFromLight(item, listing.hq)).listings[0];
    if (!newInfo) return;
    const newRatio = alphaPrice / newInfo.pricePerUnit;
    const newTheoricalNetGain = alphaPrice * newInfo.quantity
        - newInfo.pricePerUnit * newInfo.quantity;

    // Get info for the item since we just have its id
    const response = await fetch(`https://xivapi.com/item/${item}`, { mode: 'cors' });
    const json = await response.json();
    const result = {
      name: json.Name_en,
      world: newInfo.worldName,
      hq: listing.hq,
      pricePerUnit: newInfo.pricePerUnit,
      totalPrice: newInfo.pricePerUnit * newInfo.quantity,
      alphaPrice,
      ratio: newRatio.toFixed(2),
      theoricalNetGain: newTheoricalNetGain,
      numberOfSales: sales.number,
      averagePriceOfSales: sales.averagePrice.toFixed(0),
      inLastXDays: IN_THE_LAST_X_DAYS,
    };
    return result;
  }
};

export default processMessage;
