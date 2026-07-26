import logging
from typing import Dict, Any, Optional

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)

class WhatsAppSecureSystem:
    """
    Sistem Penghantaran WhatsApp Tersendiri.
    Berdasarkan contoh sedia ada (Wabiz / Dialog360) tetapi didatangkan
    dengan ciri keselamatan (security) dan ketahanan (resilience) tambahan.
    """
    
    def __init__(
        self,
        api_key: str,
        base_url: str,
        from_number: str = "",
        timeout: int = 15,    # KESELAMATAN: Timeout 15 saat supaya sistem tak tergantung (hanging)
        max_retries: int = 3, # KETAHANAN: Cuba semula jika ada masalah rangkaian sementara
    ):
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
        self._from_number = from_number
        self._timeout = timeout
        
        # 1. KETAHANAN (RESILIENCE): Konfigurasi Retry dengan Exponential Backoff
        # Mengurus masalah kecil server secara automatik (contoh: 502 Bad Gateway)
        self._session = requests.Session()
        
        retry_strategy = Retry(
            total=max_retries,
            status_forcelist=[408, 429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "OPTIONS", "POST"],
            backoff_factor=1, # Masa menunggu berganda secara eksponen (1s, 2s, 4s...)
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self._session.mount("https://", adapter)
        self._session.mount("http://", adapter)

    def _sanitize_phone_number(self, phone_number: str) -> str:
        """
        2. KESELAMATAN: Membersihkan dan memformat nombor telefon untuk memastikan 
        tiada karakter bahaya (injection) dan menepati format antarabangsa.
        """
        if not phone_number:
            return ""
        # Buang semua kecuali nombor dan tanda tambah
        sanitized = "".join(c for c in phone_number if c.isdigit() or c == "+")
        # Format ke bentuk WhatsApp rasmi (Buang "+" di hadapan)
        return sanitized.lstrip("+")

    def send_message(
        self,
        to_number: str,
        message_body: str,
    ) -> Dict[str, Any]:
        """
        Menghantar mesej teks biasa melalui WhatsApp API.
        """
        # 3. KESELAMATAN: Validasi kepanjangan input mengelakkan serangan buffer / payload yang terlampau besar
        if not message_body or len(message_body.strip()) == 0:
            raise ValueError("Mesej tidak boleh kosong.")
        if len(message_body) > 4096:
            raise ValueError("Mesej terlalu panjang (Maksimum 4096 aksara dibenarkan).")
            
        clean_number = self._sanitize_phone_number(to_number)
        if not clean_number:
            raise ValueError("Nombor telefon tidak sah.")

        # Persediaan Headers (Format Meta/Dialog360 standard)
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json"
        }
        
        # Payload Seragam (Format Provider Umum spt Dialog360 / Cloud API)
        payload = {
            "messaging_product": "whatsapp",
            "to": clean_number,
            "type": "text",
            "text": {"body": message_body},
        }
        
        try:
            # 4. KETAHANAN: HTTP Post request dilaksanakan melalui session beralaskan Retry dan Timeout
            response = self._session.post(
                f"{self._base_url}/messages", # Boleh diubahsuai mengikut 'endpoint' sebenar (cth: Wabiz pakai /api/sendText)
                json=payload,
                headers=headers,
                timeout=self._timeout
            )
            response.raise_for_status()
            data = response.json()
            
            # Dapatkan ID mesej untuk rujukan
            messages_array = data.get("messages", [])
            message_id = messages_array[0].get("id") if messages_array else data.get("id", "")

            return {
                "success": True,
                "message_id": message_id,
                "raw_response": data
            }

        except requests.exceptions.RequestException as e:
            # 5. KESELAMATAN: Mengawal log ralat supaya tidak membocorkan butiran rahsia/stacktrace sistem kepada pihak ketiga
            logger.error(f"Gagal menghantar mesej WhatsApp ke {clean_number}: {str(e)}")
            return {
                "success": False,
                "error": "Masalah rangkaian atau API gagal diakses. Mesej log terperinci direkod secara dalaman."
            }
            
    def send_template(
        self,
        to_number: str,
        template_name: str,
        language_code: str = "en",
        components: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Menghantar mesej berasaskan Templat (Template) rasmi WhatsApp.
        Berguna untuk notifikasi terancang / OTP.
        """
        clean_number = self._sanitize_phone_number(to_number)
        if not clean_number:
             raise ValueError("Nombor telefon tidak sah.")
        
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "messaging_product": "whatsapp",
            "to": clean_number,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": language_code},
                "components": components or []
            }
        }
        
        try:
            response = self._session.post(
                f"{self._base_url}/messages",
                json=payload,
                headers=headers,
                timeout=self._timeout
            )
            response.raise_for_status()
            data = response.json()
            
            messages_array = data.get("messages", [])
            message_id = messages_array[0].get("id") if messages_array else data.get("id", "")

            return {
                "success": True,
                "message_id": message_id,
                "raw_response": data
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"Gagal menghantar templat WhatsApp: {str(e)}")
            return {
                "success": False,
                "error": "Gagal berhubung dengan API penyedia WhatsApp."
            }
