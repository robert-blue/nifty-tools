
function bindUI() {
    const listOwnersButton = document.querySelector('#listSchemaOwnersButton');
    listOwnersButton.addEventListener('click', listOwners);

    const copyResultsButton = document.querySelector('#copyResultsButton');
    copyResultsButton.addEventListener('click', copyResults);
}

function showError(error) {
    const errorsElem = document.querySelector('#errors');
    errorsElem.innerHTML += error;
}

function resetErrors() {
    const errorsElem = document.querySelector('#errors');
    errorsElem.innerHTML = '';
}

async function getSchemaOwners(collectionName, schemaName, status, error) {
    let page = 0;
    let attempt = 0;
    const maxRetries = 15;
    const owners = {};

    while (attempt < maxRetries) {
        page++;

        status(`Retrieving page ${page} of results`);

        let data;
        try {
            let url = `https://wax.api.atomicassets.io/atomicassets/v1/assets?collection_name=${collectionName}&schema_name=${schemaName}&page=${page}&hide_templates_by_accounts=neftyblocksp&limit=100&order=desc&sort=asset_id`
            const response = await atomicFetch(url);
            data = await response.json();
        } catch (e) {
            error(e);
            status('Retrying in 5 seconds...')
            await sleep(5 * 1000);
            attempt++;
            continue;
        }

        if (data.data.length === 0) {
            break;
        }

        for (let d of data.data) {
            const owner = d.owner;

            if (!owners[owner]) {
                owners[owner] = 0;
            }

            owners[owner]++;
        }
    }

    return owners;
}

async function listOwners() {
    resetErrors();

    const collectionElem = document.querySelector('#collectionName');
    const collectionName = collectionElem.value;

    const schemaElem = document.querySelector('#schemaName');
    const schemaName = schemaElem.value;

    const owners = await getSchemaOwners(collectionName, schemaName, setRefreshStatus, showError);

    const resultsElem = document.querySelector('#results');

    let ownerAddresses = Object.keys(owners);
    ownerAddresses.sort();

    for (const o of ownerAddresses) {
        resultsElem.value += `${o}\n`;
    }

    setRefreshStatus('');
}

function copyResults() {
  const textarea = document.getElementById("results");
  textarea.select();
  document.execCommand("copy");
}

async function atomicFetch(url) {
  let response = await fetch(url);

  while (response.status === 429) {
    const statusMessage = document.getElementById('refreshStatus').innerText;
    setRefreshStatus('AtomicHub rate limit reached. Pausing updates.');
    await sleep(5 * 1000);
    setRefreshStatus(statusMessage);
    response = await fetch(url);
  }

  return response;
}

function setRefreshStatus(msg) {
    document.getElementById('refreshStatus').innerText = msg;
}

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

(async () => {
    bindUI();
})();