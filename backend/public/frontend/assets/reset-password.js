(()=>{
  const q=new URLSearchParams(location.search),token=q.get('token'),req=document.getElementById('resetForm'),form=document.getElementById('newPasswordForm'),msg=document.getElementById('resetMessage');
  if(!req||!form||!msg)return;
  if(token){req.hidden=true;form.hidden=false}
  req.addEventListener('submit',async e=>{e.preventDefault();try{await CapitalAPI.requestPasswordReset(document.getElementById('resetEmail').value);msg.textContent='If the account exists, a reset link has been sent.'}catch(_){msg.textContent='If the account exists, a reset link has been sent.'}});
  form.addEventListener('submit',async e=>{e.preventDefault();const a=document.getElementById('newPassword').value,b=document.getElementById('confirmPassword').value;if(a!==b){msg.textContent='Passwords do not match.';return}try{await CapitalAPI.resetPassword(token,a);msg.textContent='Password changed successfully. You can now log in.';form.hidden=true}catch(err){msg.textContent=err.message}});
})();
