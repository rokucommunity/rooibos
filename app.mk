#########################################################################
# common include file for application Makefiles
#
# Makefile Common Usage:
# > make
# > make install
# > make remove
#
# Makefile Less Common Usage:
# > make art-opt
# > make pkg
# > make install_native
# > make remove_native
# > make tr
#
# By default, ZIP_EXCLUDE will exclude -x \*.pkg -x storeassets\* -x keys\* -x .\*
# If you define ZIP_EXCLUDE in your Makefile, it will override the default setting.
#
# To exclude different files from being added to the zipfile during packaging
# include a line like this:ZIP_EXCLUDE= -x keys\*
# that will exclude any file who's name begins with 'keys'
# to exclude using more than one pattern use additional '-x <pattern>' arguments
# ZIP_EXCLUDE= -x \*.pkg -x storeassets\*
#
# Important Notes: 
# To use the "install" and "remove" targets to install your
# application directly from the shell, you must do the following:
#
# 1) Make sure that you have the curl command line executable in your path
# 2) Set the variable ROKU_DEV_TARGET in your environment to the IP 
#    address of your Roku box. (e.g. export ROKU_DEV_TARGET=192.168.1.1.
#    Set in your this variable in your shell startup (e.g. .bashrc)
##########################################################################  
DISTREL = ../dist
COMMONREL ?= ../common
SOURCEREL = .

ZIPREL = $(DISTREL)/apps
PKGREL = $(DISTREL)/packages

APPSOURCEDIR = source
IMPORTFILES = $(foreach f,$(IMPORTS),$(COMMONREL)/$f.brs)
IMPORTCLEANUP = $(foreach f,$(IMPORTS),$(APPSOURCEDIR)/$f.brs)

NATIVEDEVREL  = $(DISTREL)/rootfs/Linux86_dev.OBJ/root/nvram/incoming
NATIVEDEVPKG  = $(NATIVEDEVREL)/dev.zip
NATIVETICKLER = $(DISTREL)/application/Linux86_dev.OBJ/root/bin/plethora  tickle-plugin-installer

APPGENKEY = ./GENKEY
APPDEVID = $(shell grep DevID $(APPGENKEY) | sed "s/DevID: //")
GITCOMMIT = $(shell git rev-parse --short HEAD)
BUILDDATE = $(shell date -u | awk '{ print $$2,$$3,$$6,$$4 }')

ifdef DEVPASSWORD
    USERPASS = rokudev:$(DEVPASSWORD)
else
    USERPASS = rokudev
endif

ifndef ZIP_EXCLUDE
  ZIP_EXCLUDE= -x \*.pkg -x storeassets\* -x keys\* -x \*/.\*
endif

HTTPSTATUS = $(shell curl --silent --write-out "\n%{http_code}\n" $(ROKU_DEV_TARGET))

ifeq "$(HTTPSTATUS)" " 401"
	CURLCMD = curl -S --connect-timeout 2 --max-time 30 --retry 5
else
	CURLCMD = curl -S --connect-timeout 2 --max-time 30 --retry 5 --user $(USERPASS) --digest 
endif

.PHONY: all $(APPNAME) verify-keys home

home:
	@echo "Forcing roku to main menu screen $(ROKU_DEV_TARGET)..."
	curl -s -S -d '' http://$(ROKU_DEV_TARGET):8060/keypress/home
	sleep 2

$(APPNAME): manifest
	@echo "*** Creating $(APPNAME).zip ***"

	@echo "  >> removing old application zip $(ZIPREL)/$(APPNAME).zip"
	@if [ -e "$(ZIPREL)/$(APPNAME).zip" ]; \
	then \
		rm  $(ZIPREL)/$(APPNAME).zip; \
	fi

	@echo "  >> creating destination directory $(ZIPREL)"	
	@if [ ! -d $(ZIPREL) ]; \
	then \
		mkdir -p $(ZIPREL); \
	fi

	@echo "  >> setting directory permissions for $(ZIPREL)"
	@if [ ! -w $(ZIPREL) ]; \
	then \
		chmod 755 $(ZIPREL); \
	fi

	@echo "  >> copying imports"
	@if [ "$(IMPORTFILES)" ]; \
	then \
		mkdir $(APPSOURCEDIR)/common; \
		cp -f -p -v $(IMPORTFILES) $(APPSOURCEDIR)/common/; \
	fi \

	@echo "  >> generating build info file"
	@if [ -e "$(APPSOURCEDIR)/buildinfo.brs" ]; \
	then \
		rm  $(APPSOURCEDIR)/buildinfo.brs; \
	fi
	echo "Function BuildDate()" >> $(APPSOURCEDIR)/buildinfo.brs
	echo "  return \"${BUILDDATE}\"" >> $(APPSOURCEDIR)/buildinfo.brs
	echo "End Function" >> $(APPSOURCEDIR)/buildinfo.brs
	echo "Function BuildCommit()" >> $(APPSOURCEDIR)/buildinfo.brs
	echo "  return \"${GITCOMMIT}\"" >> $(APPSOURCEDIR)/buildinfo.brs
	echo "End Function" >> $(APPSOURCEDIR)/buildinfo.brs

# zip .png files without compression
# do not zip up Makefiles, or any files ending with '~'
	@echo "  >> creating application zip $(ZIPREL)/$(APPNAME).zip"	
	@if [ -d $(SOURCEREL) ]; \
	then \
		(zip -0 -r "$(ZIPREL)/$(APPNAME).zip" . -i \*.png $(ZIP_EXCLUDE)); \
		(zip -9 -r "$(ZIPREL)/$(APPNAME).zip" . -x \*~ -x \*.png -x Makefile $(ZIP_EXCLUDE)); \
	else \
		echo "Source for $(APPNAME) not found at $(SOURCEREL)"; \
	fi

	@if [ "$(IMPORTCLEANUP)" ]; \
	then \
		echo "  >> deleting imports";\
		rm -r -f $(APPSOURCEDIR)/common; \
	fi \

	@echo "*** packaging $(APPNAME) complete ***"

install: $(APPNAME) home
	@echo "Installing $(APPNAME) to host $(ROKU_DEV_TARGET)"
	@$(CURLCMD) --user $(USERPASS) --digest -F "mysubmit=Install" -F "archive=@$(ZIPREL)/$(APPNAME).zip" -F "passwd=" http://$(ROKU_DEV_TARGET)/plugin_install | grep "<font color" | sed "s/<font color=\"red\">//" | sed "s[</font>[["

# Make certain that the Roku is packaging with the correct key/DevID
verify-keys: $(APPGENKEY)
	@echo "Verifying developer key is $(APPDEVID)"
	@if [ "$(HTTPSTATUS)" == " 401" ]; \
  then \
		ROKU_DEV_ID=`$(CURLCMD) --user $(USERPASS) --digest http://$(ROKU_DEV_TARGET)/plugin_package | grep $(APPDEVID)`; \
		if [ "$$ROKU_DEV_IDx" == "x" ]; then echo "ROKU_DEV_ID doesn't match $(APPDEVID)"; exit 1; fi \
	else \
		ROKU_DEV_ID=`$(CURLCMD) http://$(ROKU_DEV_TARGET)/plugin_package | grep $(APPDEVID)`; \
		if [ "$$ROKU_DEV_IDx" == "x" ]; then echo "ROKU_DEV_ID doesn't match $(APPDEVID)"; exit 1; fi \
	fi

pkg: install verify-keys
	@echo "*** Creating Package ***"

	@echo "  >> creating destination directory $(PKGREL)"	
	@if [ ! -d $(PKGREL) ]; \
	then \
		mkdir -p $(PKGREL); \
	fi

	@echo "  >> setting directory permissions for $(PKGREL)"
	@if [ ! -w $(PKGREL) ]; \
	then \
		chmod 755 $(PKGREL); \
	fi

	@echo "Packaging  $(APPSRC)/$(APPNAME) on host $(ROKU_DEV_TARGET)"
	@if [ "$(HTTPSTATUS)" == " 401" ]; \
	then \
		read -p "Password: " REPLY ; echo $$REPLY | xargs -I{} $(CURLCMD) --user $(USERPASS) --digest -Fmysubmit=Package -Fapp_name=$(APPNAME)/$(VERSION) -Fpasswd={} -Fpkg_time=`expr \`date +%s\` \* 1000` "http://$(ROKU_DEV_TARGET)/plugin_package" | grep '^<tr><td><font face="Courier"><a' | sed 's/.*href=\"\([^\"]*\)\".*/\1/' | sed 's#pkgs//##' | xargs -I{} $(CURLCMD) --user $(USERPASS) --digest -o $(PKGREL)/$(APPNAME)_$(APPDEVID)_`date +%F-%T`.pkg http://$(ROKU_DEV_TARGET)/pkgs/{} ; \
	else \
		read -p "Password: " REPLY ; echo $$REPLY | xargs -I{} $(CURLCMD) -Fmysubmit=Package -Fapp_name=$(APPNAME)/$(VERSION) -Fpasswd={} -Fpkg_time=`expr \`date +%s\` \* 1000` "http://$(ROKU_DEV_TARGET)/plugin_package" | grep '^<tr><td><font face="Courier"><a' | sed 's/.*href=\"\([^\"]*\)\".*/\1/' | sed 's#pkgs//##' | xargs -I{} $(CURLCMD) -o $(PKGREL)/$(APPNAME)_$(APPDEVID)_`date +%F-%T`.pkg http://$(ROKU_DEV_TARGET)/pkgs/{} ; \
	fi

	@echo "*** Package  $(APPNAME) complete ***" 

remove:
	@echo "Removing $(APPNAME) from host $(ROKU_DEV_TARGET)"
	@if [ "$(HTTPSTATUS)" == " 401" ]; \
	then \
		$(CURLCMD) --user $(USERPASS) --digest -F "mysubmit=Delete" -F "archive=" -F "passwd=" http://$(ROKU_DEV_TARGET)/plugin_install | grep "<font color" | sed "s/<font color=\"red\">//" | sed "s[</font>[[" ; \
	else \
		curl -s -S -F "mysubmit=Delete" -F "archive=" -F "passwd=" http://$(ROKU_DEV_TARGET)/plugin_install | grep "<font color" | sed "s/<font color=\"red\">//" | sed "s[</font>[[" ; \
	fi

install_native: $(APPNAME)
	@echo "Installing $(APPNAME) to native."
	@mkdir -p $(NATIVEDEVREL)
	@cp $(ZIPREL)/$(APPNAME).zip  $(NATIVEDEVPKG)
	@$(NATIVETICKLER)

remove_native:
	@echo "Removing $(APPNAME) from native."
	@rm $(NATIVEDEVPKG)
	@$(NATIVETICKLER)

APPS_JPG_ART=`\find . -name "*.jpg"`

art-jpg-opt:
	p4 edit $(APPS_JPG_ART)
	for i in $(APPS_JPG_ART); \
	do \
		TMPJ=`mktemp` || return 1; \
		echo "optimizing $$i"; \
		(jpegtran -copy none -optimize -outfile $$TMPJ $$i && mv -f $$TMPJ $$i &); \
	done
	wait
	p4 revert -a $(APPS_JPG_ART)

APPS_PNG_ART=`\find . -name "*.png"`

art-png-opt:
	p4 edit $(APPS_PNG_ART)
	for i in $(APPS_PNG_ART); \
	do \
		(optipng -o7 $$i &); \
	done
	wait
	p4 revert -a $(APPS_PNG_ART)

art-opt: art-png-opt art-jpg-opt

tr:
	p4 edit locale/.../translations.xml
	../../rdk/rokudev/utilities/linux/bin/maketr
	rm locale/en_US/translations.xml
	p4 revert -a locale/.../translations.xml

screenshot:
	SCREENSHOT_TIME=`date "+%s"`; \
	curl -m 1 -o screenshot.jpg --user $(USERPASS) --digest "http://$(ROKU_DEV_TARGET)/pkgs/dev.jpg?time=$$SCREENSHOT_TIME" -H 'Accept: image/png,image/*;q=0.8,*/*;q=0.5' -H 'Accept-Language: en-US,en;q=0.5' -H 'Accept-Encoding: gzip, deflate'




