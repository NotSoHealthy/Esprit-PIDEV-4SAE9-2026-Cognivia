<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=(social.displayInfo!false) displayMessage=false displayRequiredFields=false bodyClass="login-page"; section>
    <#if (section!"") = "header">
        <#-- Title moved into form -->
    <#elseif (section!"") = "form">
        <h1 id="kc-page-title">${msg("customSignIn")}</h1>

        <form id="kc-login-form" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">
            <div class="form-group">
                <input id="username" name="username" value="${(login.username!'')}" type="text" autocomplete="on" placeholder="${msg("customUsernameOrEmail")}" />
            </div>

            <div class="form-group">
                <input id="password" name="password" type="password" autocomplete="off" placeholder="${msg("customPassword")}" />
            </div>

            <div class="form-group">
                <input class="btn-primary" name="login" id="kc-login" type="submit" value="${msg("customSignIn")}" />
            </div>
        </form>

        <#if realm.password && social.providers?? && social.providers?has_content>
            <div id="kc-social-providers">
                <div class="separator">OR</div>
                <div class="registration-social-label">${msg("customConnectWith")}</div>
                <ul>
                    <#list social.providers as p>
                        <li>
                            <a href="${p.loginUrl}" id="zocial-${p.alias}" class="zocial ${p.alias}">
                                <#if p.alias == "google">
                                    <img src="https://www.vectorlogo.zone/logos/google/google-icon.svg" alt="Google">
                                    <span>Google</span>
                                <#elseif p.alias == "facebook">
                                    <img src="https://www.vectorlogo.zone/logos/facebook/facebook-official.svg" alt="Facebook">
                                    <span>Facebook</span>
                                <#else>
                                    <span>${p.displayName!}</span>
                                </#if>
                            </a>
                        </li>
                    </#list>
                </ul>
            </div>
        </#if>

        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
            <div class="registration-footer">
                ${msg("customNoAccount")} <a href="${url.registrationUrl}">${msg("customSignUp")}</a>
            </div>
        </#if>
    </#if>
</@layout.registrationLayout>
