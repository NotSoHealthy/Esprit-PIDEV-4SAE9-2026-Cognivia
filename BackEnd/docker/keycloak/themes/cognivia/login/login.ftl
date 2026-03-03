<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=social.displayInfo; section>
    <#if section = "title">
        ${msg("loginTitle",(realm.displayName!''))}
    <#elseif section = "header">
        <h1 id="kc-page-title">${msg("loginTitleHtml",(realm.displayNameHtml!''))}</h1>
    <#elseif section = "form">
        <div id="kc-form">
          <div id="kc-form-wrapper">
            <#if realm.password>
                <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">
                    <div class="form-group">
                        <input id="username" name="username" value="${(login.username!'')}" type="text" autofocus autocomplete="off" 
                               placeholder="${msg("usernameOrEmail")}" required />
                        <#if messagesPerField.existsError('username','password')>
                            <span id="input-error-auth" class="instruction-error" aria-live="polite">
                                ${kcSanitize(messagesPerField.get('username','password'))?no_esc}
                            </span>
                        </#if>
                    </div>

                    <div class="form-group relative">
                        <input id="password" name="password" type="password" autocomplete="off" placeholder="${msg("password")}" required />
                        <#if realm.resetPasswordAllowed>
                            <span class="forgot-password-link">
                                <a id="forgot-password" href="${url.loginResetCredentialsUrl}">${msg("doForgotPassword")}?</a>
                            </span>
                        </#if>
                    </div>

                    <div id="kc-form-buttons" class="form-group">
                        <input name="login" id="kc-login" type="submit" value="${msg("doLogIn")}" class="btn-primary" />
                    </div>
                </form>
            </#if>
          </div>
        </div>

        <#if realm.password && social.providers??>
            <div id="kc-social-providers">
                <div class="separator">
                  <span>${msg("identity-provider-login-label")}</span>
                </div>
                <ul>
                    <#list social.providers as p>
                        <li>
                            <a href="${p.loginUrl}" id="zocial-${p.alias}" class="zocial ${p.providerId}">
                                <span>${p.displayName!}</span>
                            </a>
                        </li>
                    </#list>
                </ul>
            </div>
        </#if>
    <#elseif section = "info" >
        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
            <div id="kc-registration">
                <span>${msg("noAccount")} <a href="${url.registrationUrl}">${msg("doRegister")}</a></span>
            </div>
        </#if>
    </#if>
</@layout.registrationLayout>
