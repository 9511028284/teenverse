import { supabase } from '../supabase';
import { createCashfreeCheckout } from './cashfreeSdk';

export const processCashfreePayment = async (params, onSuccess, onFail) => {
  try {
    const cashfree = await createCashfreeCheckout();
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

    const createdOrderId = orderData?.order_id || orderData?.orderId;
    if (orderError || !orderData?.payment_session_id || !createdOrderId) throw new Error("Order creation failed");

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
        orderId: createdOrderId,
        appId: params.appId
      }
    });

    if (verifyData?.success) {
      const verifiedOrderId = verifyData.order_id || verifyData.orderId || verifyData?.order?.order_id || createdOrderId;
      onSuccess({ ...verifyData, order_id: verifiedOrderId, orderId: verifiedOrderId });
    } else {
      onFail("Payment not completed or failed.");
    }

  } catch (err) {
    console.error(err);
    onFail(err.message);
  }
};
