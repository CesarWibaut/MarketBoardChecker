import fetch from 'node-fetch';

const getFromUrl = async (url) => {
  try {
    const response = await fetch(url);
    const json = await response.json();
    return json;
  } catch (error) {
    // console.error(error);
  }
  return null;
};

export default getFromUrl;
