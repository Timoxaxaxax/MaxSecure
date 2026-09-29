const $=id=>document.getElementById(id);
let enrollmentSecret=null;

function toast(m){const e=$("toast");e.textContent=m;e.classList.add("show");clearTimeout(window.__t);window.__t=setTimeout(()=>e.classList.remove("show"),2800)}
function clean(e){e.value=e.value.replace(/\D/g,"").slice(0,6)}
["setupTotp","totpEncrypt","totpDecrypt"].forEach(id=>$(id).addEventListener("input",()=>clean($(id))));

async function refresh(){
  const ok=await VaultCrypto.hasSecret();
  $("setupPanel").classList.toggle("hidden",ok);
  $("secretPanel").classList.add("hidden");
  $("tabs").classList.toggle("hidden",!ok);
  $("encrypt").classList.toggle("hidden",!ok);
  $("decrypt").classList.toggle("hidden",!ok);
}
refresh();

$("createSecretBtn").onclick=async()=>{
  try{
    enrollmentSecret=await VaultCrypto.createEnrollment();
    $("secretDisplay").value=enrollmentSecret;
    $("secretPanel").classList.remove("hidden");
    $("setupPanel").classList.add("hidden");
    toast("Секрет создан. Добавьте его в Google Authenticator.");
  }catch(e){toast(e.message)}
};
$("confirmSecretBtn").onclick=async()=>{
  try{
    if(!(await VaultCrypto.verifyTotp($("setupTotp").value)))throw Error("Код не совпадает. Проверьте, что ключ введён в Google Authenticator как Time based.");
    $("secretPanel").classList.add("hidden");$("tabs").classList.remove("hidden");$("encrypt").classList.remove("hidden");$("decrypt").classList.remove("hidden");
    toast("Google Authenticator успешно привязан");
  }catch(e){toast(e.message)}
};
$("copySecret").onclick=async()=>{
  try{await navigator.clipboard.writeText($("secretDisplay").value);toast("Ключ скопирован")}catch{toast("Не удалось скопировать")}
};
$("deleteSecretBtn").onclick=async()=>{
  if(confirm("Удалить локальный TOTP-ключ? После этого текущие сообщения этим экземпляром открыть будет нельзя.")){
    await VaultCrypto.dbDelete();location.reload();
  }
};

document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{
 document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
 document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));
 b.classList.add("active");$(b.dataset.tab).classList.add("active");
});

$("encryptBtn").onclick=async()=>{
 try{$("cipherOut").value=await VaultCrypto.encryptText($("plainText").value,$("totpEncrypt").value);$("encryptResult").classList.remove("hidden");toast("Зашифровано")}
 catch(e){toast(e.message)}
};
$("decryptBtn").onclick=async()=>{
 try{$("plainOut").value=await VaultCrypto.decryptText($("cipherIn").value,$("totpDecrypt").value);$("decryptResult").classList.remove("hidden");toast("Расшифровано")}
 catch(e){$("decryptResult").classList.add("hidden");toast(e.message)}
};
async function copy(id){try{await navigator.clipboard.writeText($(id).value);toast("Скопировано")}catch{toast("Буфер обмена недоступен")}}
$("copyCipher").onclick=()=>copy("cipherOut");$("copyPlain").onclick=()=>copy("plainOut");
$("downloadCipher").onclick=()=>{
 const b=new Blob([$("cipherOut").value],{type:"text/plain;charset=utf-8"}),a=document.createElement("a");
 a.href=URL.createObjectURL(b);a.download="vaulttext-code.txt";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));