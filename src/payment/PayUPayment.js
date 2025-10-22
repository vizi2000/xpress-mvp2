/**
 * PayUPayment - Mock payment gateway for PayU
 * Opens payment page in new window for testing purposes
 */
export class PayUPayment {
    constructor() {
        this.isMock = true;
        this.apiUrl = 'https://secure.payu.com';
        console.log('💳 PayUPayment initialized (MOCK MODE)');
    }

    /**
     * Create payment and open payment page
     * @param {Object} orderData - Order information
     * @param {number} amount - Payment amount in PLN
     * @returns {Promise<Object>} Payment result
     */
    async createPayment(orderData, amount) {
        console.log('🎭 PayU MOCK Payment:', {
            order: orderData.tracking_code || orderData.orderId || 'MOCK-' + Date.now(),
            amount: amount,
            currency: 'PLN',
            pickup: orderData.pickupAddress || orderData.pickup,
            delivery: orderData.deliveryAddress || orderData.delivery
        });

        // Create mock payment page
        const mockPaymentUrl = this.createMockPaymentPage(orderData, amount);

        // Open in new window
        const paymentWindow = window.open(mockPaymentUrl, '_blank', 'width=600,height=700,scrollbars=yes');

        if (!paymentWindow) {
            alert('Zezwól na wyskakujące okna (popup) aby kontynuować płatność.');
            return { success: false, error: 'popup_blocked' };
        }

        return {
            success: true,
            mock: true,
            orderId: orderData.tracking_code || orderData.orderId || 'MOCK-ORDER',
            amount: amount,
            currency: 'PLN',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Create HTML for mock payment page
     * @param {Object} orderData - Order information
     * @param {number} amount - Payment amount
     * @returns {string} Data URL with HTML content
     */
    createMockPaymentPage(orderData, amount) {
        const orderId = orderData.tracking_code || orderData.orderId || 'MOCK-' + Date.now();
        const pickup = orderData.pickupAddress || orderData.pickup || 'N/A';
        const delivery = orderData.deliveryAddress || orderData.delivery || 'N/A';

        const html = `
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PayU Payment - MOCK</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            background: linear-gradient(135deg, #2ECC71 0%, #27AE60 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .card {
            background: white;
            border-radius: 24px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .logo {
            text-align: center;
            font-size: 36px;
            font-weight: 700;
            color: #2ECC71;
            margin-bottom: 10px;
            letter-spacing: -0.5px;
        }
        .logo-subtitle {
            text-align: center;
            font-size: 14px;
            color: #999;
            margin-bottom: 30px;
        }
        .mock-badge {
            background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            display: inline-block;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 20px;
            text-align: center;
            width: 100%;
            box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
        }
        h1 {
            color: #333;
            font-size: 24px;
            margin-bottom: 24px;
            font-weight: 600;
        }
        .detail {
            display: flex;
            justify-content: space-between;
            padding: 14px 0;
            border-bottom: 1px solid #eee;
            align-items: flex-start;
        }
        .detail:last-child {
            border-bottom: none;
        }
        .label {
            color: #666;
            font-size: 14px;
            min-width: 100px;
        }
        .value {
            font-weight: 600;
            color: #333;
            text-align: right;
            font-size: 14px;
            word-break: break-word;
            max-width: 300px;
        }
        .amount {
            font-size: 48px;
            color: #2ECC71;
            text-align: center;
            margin: 30px 0;
            font-weight: 700;
            letter-spacing: -1px;
        }
        .amount-label {
            text-align: center;
            color: #999;
            font-size: 14px;
            margin-top: -20px;
            margin-bottom: 20px;
        }
        .btn {
            width: 100%;
            background: linear-gradient(135deg, #2ECC71 0%, #27AE60 100%);
            color: white;
            border: none;
            padding: 18px;
            border-radius: 12px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 20px;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 12px rgba(46, 204, 113, 0.3);
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(46, 204, 113, 0.4);
        }
        .btn:active {
            transform: translateY(0);
        }
        .btn-secondary {
            background: white;
            color: #2ECC71;
            border: 2px solid #2ECC71;
            box-shadow: none;
            margin-top: 10px;
        }
        .btn-secondary:hover {
            background: #f5f5f5;
        }
        .info {
            background: #fff3cd;
            border-left: 4px solid #ff9800;
            padding: 16px;
            border-radius: 8px;
            margin-top: 20px;
            font-size: 13px;
            color: #856404;
            line-height: 1.6;
        }
        .info strong {
            display: block;
            margin-bottom: 5px;
            font-size: 14px;
        }
        .payment-methods {
            display: flex;
            gap: 10px;
            margin-top: 20px;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 12px;
        }
        .payment-method {
            flex: 1;
            padding: 12px;
            background: white;
            border: 2px solid #eee;
            border-radius: 8px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 12px;
            color: #666;
        }
        .payment-method:hover {
            border-color: #2ECC71;
            color: #2ECC71;
        }
        .payment-method.active {
            border-color: #2ECC71;
            background: #e8f8f0;
            color: #2ECC71;
        }
        .secure-badge {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-top: 20px;
            color: #999;
            font-size: 12px;
        }
        .secure-icon {
            font-size: 16px;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="logo">PayU</div>
        <div class="logo-subtitle">Bezpieczne płatności online</div>

        <div style="text-align: center;">
            <span class="mock-badge">🎭 MOCK MODE - TEST ONLY</span>
        </div>

        <h1>Potwierdzenie płatności</h1>

        <div class="detail">
            <span class="label">Numer zamówienia:</span>
            <span class="value">${orderId}</span>
        </div>
        <div class="detail">
            <span class="label">Odbiór:</span>
            <span class="value">${pickup}</span>
        </div>
        <div class="detail">
            <span class="label">Dostawa:</span>
            <span class="value">${delivery}</span>
        </div>

        <div class="amount">${amount.toFixed(2)} PLN</div>
        <div class="amount-label">Kwota do zapłaty</div>

        <div class="payment-methods">
            <div class="payment-method active" onclick="selectMethod(this)">
                💳<br>Karta
            </div>
            <div class="payment-method" onclick="selectMethod(this)">
                🏦<br>Przelew
            </div>
            <div class="payment-method" onclick="selectMethod(this)">
                📱<br>BLIK
            </div>
        </div>

        <button class="btn" onclick="confirmPayment()">
            ✓ Zapłać ${amount.toFixed(2)} PLN
        </button>

        <button class="btn btn-secondary" onclick="window.close()">
            Anuluj płatność
        </button>

        <div class="info">
            <strong>⚠️ Tryb testowy</strong>
            To jest symulowana strona płatności do celów testowych.
            Żadna rzeczywista transakcja nie zostanie przeprowadzona.
        </div>

        <div class="secure-badge">
            <span class="secure-icon">🔒</span>
            <span>Secured by PayU (Mock)</span>
        </div>
    </div>

    <script>
        function selectMethod(element) {
            document.querySelectorAll('.payment-method').forEach(el => {
                el.classList.remove('active');
            });
            element.classList.add('active');
        }

        function confirmPayment() {
            const activeMethod = document.querySelector('.payment-method.active');
            const methodName = activeMethod.textContent.trim().split('\\n')[1];

            // Simulate processing
            const btn = document.querySelector('.btn');
            btn.textContent = '⏳ Przetwarzanie płatności...';
            btn.disabled = true;

            setTimeout(() => {
                alert('✅ Płatność potwierdzona!\\n\\nMetoda: ' + methodName + '\\nNumer zamówienia: ${orderId}\\nKwota: ${amount.toFixed(2)} PLN\\n\\nW wersji produkcyjnej nastąpiłoby rzeczywiste przetworzenie płatności przez PayU.');
                window.close();
            }, 1500);
        }
    </script>
</body>
</html>
        `;

        return 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
    }
}
