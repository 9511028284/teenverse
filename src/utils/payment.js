import { supabase } from '../supabase';

export const processCashfreePayment = async (params, onSuccess, onFail) => {
  const cashfree = new window.Cashfree({ mode: "production" }); // Use "production" for live

  try {
    // 1. Call Edge Function to CREATE ORDER
    const { data: orderData, error: orderError } = await supabase.functions.invoke('payment-gateway', {
      body: { 
        action: 'CREATE_ORDER',
        amount: params.amount,
        customerPhone: params.customerPhone,
        freelancerId: params.freelancerId,
        appId: params.appId,
        userId: params.userId
      }
    });

    if (orderError || !orderData.payment_session_id) throw new Error("Order creation failed");

    // 2. Open Cashfree Modal
    await cashfree.checkout({
      paymentSessionId: orderData.payment_session_id,
      redirectTarget: "_modal" 
    });

    // 3. IMPORTANT: When modal closes, VERIFY the payment via Edge Function
    // We don't trust the frontend; we ask the server to check Cashfree's API
    const { data: verifyData } = await supabase.functions.invoke('payment-gateway', {
      body: { 
        action: 'VERIFY_ORDER',
        orderId: orderData.order_id,
        appId: params.appId
      }
    });

    if (verifyData?.success) {
      onSuccess(verifyData);
    } else {
      onFail("Payment not completed or failed.");
    }

  } catch (err) {
    console.error(err);
    onFail(err.message);
  }
};