<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=social.displayInfo showAnotherWayIfPresent=true bodyClass="login-page">
    <#if section = "header">
        ${msg("loginTitleHtml",(realm.displayNameHtml!''))}
    <#elseif section = "form">
        <h1 id="kc-page-title">Log In</h1>
        
        <div id="kc-form">
            <div id="kc-form-wrapper">
                <#if realm.password>
                    <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">
                        
                        <div class="form-group">
                            <input tabindex="1" id="username" name="username" value="${(login.username!'')}"  type="text" autofocus autocomplete="off"
                                   placeholder="Username or email" />
                        </div>

                        <div class="form-group">
                            <input tabindex="2" id="password" name="password" type="password" autocomplete="off"
                                   placeholder="Password" />
                            
                            <#if realm.resetPasswordAllowed>
                                <div class="forgot-password-link">
                                    <a tabindex="5" href="${url.loginResetCredentialsUrl}">Forgot Password?</a>
                                </div>
                            </#if>
                        </div>

                        <div id="kc-form-buttons" class="form-group">
                            <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
                            <input tabindex="4" class="btn-primary" name="login" id="kc-login" type="submit" value="Log In"/>
                        </div>
                    </form>
                </#if>
            </div>
        </div>

        <#if realm.password && social.providers??>
            <div id="kc-social-providers">
                <span class="separator">OR</span>
                <ul>
                    <#list social.providers as p>
                        <li>
                            <a href="${p.loginUrl}" id="social-${p.alias}" class="zocial ${p.alias}">
                                <#if p.alias == "google">
                                    <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google">
                                </#if>
                                <#if p.alias == "facebook">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook">
                                </#if>
                                <span>${p.displayName}</span>
                            </a>
                        </li>
                    </#list>
                </ul>
            </div>
        </#if>

    <#elseif section = "info" >
        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
            <div id="kc-registration">
                <span>Don't have an account?</span>
                <a tabindex="6" href="${url.registrationUrl}">Sign Up</a>
            </div>
        </#if>
    </#if>
</@layout.registrationLayout>
