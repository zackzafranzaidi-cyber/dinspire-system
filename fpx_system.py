import hashlib
import hmac
import json
import logging
from decimal import Decimal
from typing import Dict, Any, Optional

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)

class FPXSecureSystem:
    """
    Sistem FPX (Financial Process Exchange) Tersendiri.
    Berdasarkan contoh sedia ada (Billplz/ToyyibPay) tetapi dengan 
    penambahan ciri keselamatan dan ketahanan (resilience) yang kukuh.
    """
    
    def __init__(
        self,
        api_key: str,
        signature_key: str,
        merchant_id: str,
        base_url: str = "https://api.sandbox-fpx.com/v1",
        timeout: int = 10,  # KESELAMATAN: Timeout 10 saat untuk elak sistem tergantung (hanging)
        max_retries: int = 3, # KETAHANAN: Cuba semula 3 kali jika berlaku ralat rangkaian/server
    ):
        self._api_key = api_key
        self._signature_key = signature_key
        self._merchant_id = merchant_id
        self._base_url = base_url
        self._timeout = timeout
        
        # 1. KETAHANAN (RESILIENCE): Konfigurasi Retry dengan Exponential Backoff
        self._session = requests.Session()
        self._session.auth = (self._api_key, "")
        
        retry_strategy = Retry(
            total=max_retries,
            status_forcelist=[408, 429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "OPTIONS", "POST"],
            backoff_factor=1, # Exponential backoff: masa menunggu bertambah (1s, 2s, 4s...)
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self._session.mount("https://", adapter)
        self._session.mount("http://", adapter)

    def create_payment(
        self,
        amount: Decimal,
        reference: str,
        description: str,
        customer_email: str,
        customer_name: str,
        return_url: str,
        callback_url: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Mencipta pautan pembayaran FPX yang baharu.
        """
        # 2. KESELAMATAN: Validasi input asas sebelum dihantar ke API luar
        if amount <= 0:
            raise ValueError("Jumlah bayaran (amount) mesti lebih daripada 0")
            
        payload = {
            "merchant_id": self._merchant_id,
            "email": customer_email,
            "name": customer_name,
            "amount": int(amount * 100), # Simpan dalam sen (cents) untuk ketepatan nilai wang (hindar ralat float)
            "description": description[:200], # 3. KESELAMATAN: Hadkan panjang untuk elak buffer/payload terlalu besar
            "reference": reference,
            "return_url": return_url,
            "callback_url": callback_url,
        }
        
        try:
            # 4. KETAHANAN & KESELAMATAN: Menggunakan session yang ada auto-retry dan timeout
            resp = self._session.post(
                f"{self._base_url}/payments", 
                json=payload, 
                timeout=self._timeout
            )
            resp.raise_for_status()
            data = resp.json()
            
            return {
                "payment_url": data.get("url"),
                "transaction_id": data.get("id"),
                "reference": reference
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Ralat sambungan ketika mencipta pembayaran FPX: {str(e)}")
            # 5. KESELAMATAN: Menguruskan ralat dengan selamat tanpa mendedahkan maklumat/sistem dalaman (stacktrace sensitif)
            raise SystemError("Gagal berhubung dengan Gateway FPX. Sila cuba sebentar lagi.") from e

    def verify_webhook_signature(self, payload_str: str, received_signature: str) -> bool:
        """
        Mengesahkan tandatangan payload webhook untuk memastikan ia datang dari sumber yang sah.
        """
        if not received_signature:
            logger.warning("Amaran Keselamatan: Tandatangan tiada dalam webhook")
            return False
            
        # 6. KESELAMATAN: Jana HMAC-SHA256 dari payload menggunakan kunci rahsia yang hanya anda dan gateway tahu
        expected_signature = hmac.new(
            self._signature_key.encode('utf-8'), 
            payload_str.encode('utf-8'), 
            hashlib.sha256
        ).hexdigest()
        
        # 7. KESELAMATAN: Bandingkan secara selamat (constant-time comparison) untuk elak "Timing Attacks"
        is_valid = hmac.compare_digest(expected_signature, received_signature)
        
        if not is_valid:
            logger.warning("Amaran Keselamatan: Tandatangan webhook FPX tidak sepadan. Kemungkinan percubaan manipulasi data (spoofing).")
            
        return is_valid

    def parse_webhook(self, payload: dict, received_signature: str) -> dict:
        """
        Memproses data webhook selepas pengesahan keselamatan berjaya.
        """
        # Ubah ke string JSON yang seragam untuk semakan signature
        payload_str = json.dumps(payload, separators=(',', ':'), sort_keys=True)
        
        if not self.verify_webhook_signature(payload_str, received_signature):
            # 8. KESELAMATAN: Tolak terus jika signature gagal, halang perubahan status bayaran secara palsu
            raise PermissionError("Pengesahan keselamatan (signature) gagal. Data webhook ditolak.")
            
        paid = payload.get("status", "").lower() == "paid"
        amount_cents = int(payload.get("amount", "0"))
        
        return {
            "reference": payload.get("reference", ""),
            "status": "paid" if paid else "failed",
            "amount": Decimal(amount_cents) / 100,
            "transaction_id": payload.get("id", ""),
        }
