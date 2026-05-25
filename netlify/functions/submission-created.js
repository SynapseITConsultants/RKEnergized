/**
 * Netlify Function: submission-created
 *
 * Auto-triggered by Netlify Forms on every new submission.
 * Forwards lead data to the Five9 Web2Campaign endpoint
 * targeting the "Appointment Setting" campaign.
 *
 * Field mapping (form field -> Five9 list column):
 *   firstName  -> first_name
 *   lastName   -> last_name
 *   email      -> email
 *   phone      -> number1        (stripped to digits only)
 *   address    -> street
 *   bill       -> monthly_bill   (custom column)
 *   homeowner  -> homeowner_status (custom column)
 *   interest   -> program_interest (custom column)
 *   how        -> lead_source    (custom column)
 *   message    -> notes          (custom column)
 *
 * Required Netlify environment variable:
 *   F9KEY  - Five9 Web2Campaign API key for the Appointment Setting campaign
 */

const FIVE9_ENDPOINT  = 'https://api.five9.com/web2campaign/AddToList';
const FIVE9_CAMPAIGN  = 'Appointment Setting';
const TARGET_FORM     = 'solar-quote';

exports.handler = async (event) => {
  try {
    // ── Parse the Netlify submission payload ────────────────
    const body    = JSON.parse(event.body || '{}');
    const payload = body.payload || {};
    const data    = payload.data  || {};

    // Only process our solar-quote form. Ignore any other future forms.
    if (payload.form_name !== TARGET_FORM) {
      console.log(`Skipped: form_name="${payload.form_name}" is not "${TARGET_FORM}"`);
      return { statusCode: 200, body: 'Skipped: non-target form' };
    }

    // ── Build the Five9 query parameters ────────────────────
    // Five9 wants phone as 10 digits, no formatting.
    const phoneDigits = (data.phone || '').replace(/\D/g, '');

    const params = new URLSearchParams({
      F9key:            process.env.F9KEY || '',
      F9campaignname:   FIVE9_CAMPAIGN,
      number1:          phoneDigits,
      first_name:       data.firstName || '',
      last_name:        data.lastName  || '',
      email:            data.email     || '',
      street:           data.address   || '',
      monthly_bill:     data.bill      || '',
      homeowner_status: data.homeowner || '',
      program_interest: data.interest  || '',
      lead_source:      data.how       || '',
      notes:            data.message   || ''
    });

    const targetUrl = `${FIVE9_ENDPOINT}?${params.toString()}`;

    // Mask the F9key in logs so it doesn't end up in build output
    console.log('Forwarding lead to Five9:', targetUrl.replace(/F9key=[^&]+/, 'F9key=***'));

    // ── Send the request to Five9 ───────────────────────────
    const response     = await fetch(targetUrl, { method: 'POST' });
    const responseText = await response.text();

    console.log(`Five9 response: HTTP ${response.status}`);
    console.log('Five9 body:', responseText.slice(0, 500));

    if (!response.ok) {
      console.error('Five9 rejected the request.');
      return {
        statusCode: 502,
        body: JSON.stringify({
          error:        'Five9 rejected the request',
          status:       response.status,
          five9Reply:   responseText
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok:         true,
        five9HTTP:  response.status,
        five9Reply: responseText
      })
    };

  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
