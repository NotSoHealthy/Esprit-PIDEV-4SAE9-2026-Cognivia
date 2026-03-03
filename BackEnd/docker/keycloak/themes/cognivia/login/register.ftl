<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true displayMessage=true displayRequiredFields=false bodyClass="register-page">
    <#if section = "header">
        ${msg("registerTitleHtml",(realm.displayNameHtml!''))}
    <#elseif section = "form">
        <h1 id="kc-page-title">Register</h1>

        <form id="kc-register-form" action="${url.registrationAction}" method="post">
            <div class="form-group">
                <input type="text" id="user.attributes.age" name="user.attributes.age" value="${(register.formData['user.attributes.age']!'')}" 
                       placeholder="Age" autocomplete="off" />
            </div>

            <div class="form-group">
                <input type="text" id="lastName" name="lastName" value="${(register.formData.lastName!'')}" 
                       placeholder="Name (optional)" autocomplete="name" />
            </div>

            <div class="form-group">
                <input type="text" id="email" name="email" value="${(register.formData.email!'')}" 
                       placeholder="Email address" autocomplete="email" />
            </div>

            <#if passwordRequired??>
                <div class="form-group">
                    <input type="password" id="password" name="password" 
                           placeholder="Password" autocomplete="new-password" />
                </div>

                <div class="form-group">
                    <input type="password" id="password-confirm" name="password-confirm" 
                           placeholder="Confirm Password" autocomplete="new-password" />
                </div>
            </#if>

            <div class="form-group">
                <input class="btn-primary" type="submit" value="Create Account" />
            </div>
        </form>

        <div id="kc-registration">
            <span>Already registered?</span>
            <a href="${url.loginUrl}">Sign In</a>
        </div>
    </#if>
</@layout.registrationLayout>
