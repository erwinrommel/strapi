/*
 *
 * HomePage
 *
 */

import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { createStructuredSelector } from 'reselect';

import {
  findIndex,
  findKey,
  forEach,
  get,
  isEmpty,
  includes,
  join,
  map,
  replace,
  toNumber,
} from 'lodash';
import { FormattedMessage } from 'react-intl';
import Helmet from 'react-helmet';
import Select from 'react-select';
import { router } from 'app';

// design
import ContentHeader from 'components/ContentHeader';
import Debug from 'components/Debug';
import EditForm from 'components/EditForm';
import HeaderNav from 'components/HeaderNav';
import List from 'components/List';
import RowDatabase from 'components/RowDatabase';
import SelectOptionLanguage from 'components/SelectOptionLanguage';
import RowLanguage from 'components/RowLanguage';

// App selectors
import { makeSelectSections, makeSelectEnvironments } from 'containers/App/selectors';

// utils
import { checkFormValidity, getRequiredInputsDb } from '../../utils/inputValidations';
import getFlag, { formatLanguageLocale } from '../../utils/getFlag';
import sendUpdatedParams from '../../utils/sendUpdatedParams';

import selectHomePage from './selectors';
import {
  cancelChanges,
  changeDefaultLanguage,
  changeInput,
  configFetch,
  databaseEdit,
  databasesFetch,
  databaseDelete,
  editSettings,
  emptyDbModifiedData,
  languageDelete,
  languagesFetch,
  newLanguagePost,
  newDatabasePost,
  setErrors,
  specificDatabaseFetch,
} from './actions'

import styles from './styles.scss';
import config from './config.json';

export class HomePage extends React.Component { // eslint-disable-line react/prefer-stateless-function

  constructor(props) {
    super(props);
    this.customComponents = config.customComponents;
    this.components = {
      // editForm: EditForm,
      defaultComponent: EditForm,
      list: List,
      defaultComponentWithEnvironments: HeaderNav,
      debug: Debug,
    };

    // allowing state only for database modal purpose
    this.state = {
      modal: false,
      toggleDefaultConnection: false,
    };

    this.sendUpdatedParams = sendUpdatedParams.bind(this);
  }

  componentDidMount() {
    if (this.props.params.slug) {
      this.handleFetch(this.props);
    } else {
      router.push(`/plugins/settings-manager/${get(this.props.menuSections, ['0', 'items', '0', 'slug'])}`);
    }
  }

  componentWillReceiveProps(nextProps) {
    // check if params slug updated
    if (this.props.params.slug !== nextProps.params.slug && nextProps.params.slug) {
      if (nextProps.params.slug) {
        // get data from api if params slug updated
        this.handleFetch(nextProps);
      } else {
        // redirect user if no params slug provided
        router.push(`/plugins/settings-manager/${get(this.props.menuSections, ['0', 'items', '0', 'slug'])}`);
      }
    } else if (this.props.params.env !== nextProps.params.env && nextProps.params.env && this.props.params.env) {
      // get data if params env updated
      this.handleFetch(nextProps);
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.home.didCreatedNewLanguage !== this.props.home.didCreatedNewLanguage) {
      this.handleFetch(this.props);
    }

    if (prevProps.home.didCreatedNewDb !== this.props.home.didCreatedNewDb) {
      this.handleFetch(this.props);
    }
  }

  /* eslint-disable react/sort-comp */
  /* eslint-disable jsx-a11y/no-static-element-interactions */
  addConnection = (e) => {
    e.preventDefault();
    const newData = {};
    /* eslint-disable no-template-curly-in-string */
    const dbName = get(this.props.home.modifiedData, 'database.connections.${name}.name');
    map(this.props.home.modifiedData, (data, key) => {
      const k = replace(key, '${name}', dbName);

      if (key !== 'database.connections.${name}.name') {
        newData[k] = data;
      }
    });

    // If size of modifiedData === 2 the user hasn't filled any inputs
    // TODO change
    const formErrors = getRequiredInputsDb(this.props.home.modifiedData);
    // const formErrors = size(this.props.home.modifiedData)  === 2 ?
    //   getRequiredInputsDb() :
    //   checkFormValidity(this.props.home.modifiedData, this.props.home.formValidations);

    if (isEmpty(formErrors)) {
      // this.props.setErrors([]);
      this.props.newDatabasePost(this.props.params.env, newData);
    } else {
      this.props.setErrors(formErrors);
    }
  }

  changeDefaultLanguage = ({ target }) => {
    // create new object configsDisplay based on store property configsDisplay
    const configsDisplay = {
      name: this.props.home.configsDisplay.name,
      description: this.props.home.configsDisplay.description,
      sections: [],
    };

    // Find the index of the new setted language
    const activeLanguageIndex = findIndex(this.props.home.configsDisplay.sections, ['name', target.id]);

    forEach(this.props.home.configsDisplay.sections, (section, key) => {
      // set all Language active state to false
      if (key !== activeLanguageIndex) {
        configsDisplay.sections.push({ name: section.name, active: false });
      } else {
        // set the new language active state to true
        configsDisplay.sections.push({ name: section.name, active: true });
      }
    });

    // reset all the configs to ensure component is updated
    this.props.changeDefaultLanguage(configsDisplay, target.id);

    // format the default locale
    const defaultLanguageArray = formatLanguageLocale(target.id);

    // Edit the new config
    this.props.editSettings({ 'language.defaultLocale': join(defaultLanguageArray, '_') }, 'i18n');
  }

  getDatabase = (databaseName) => {
    // allow state here just for modal purpose
    this.props.specificDatabaseFetch(databaseName, this.props.params.env);
    // this.setState({ modal: !this.state.modal });
  }

  handleFetch(props) {
    const apiUrl = props.params.env ? `${props.params.slug}/${props.params.env}` : props.params.slug;

    switch(props.params.slug) {
      case 'languages':
        return this.props.languagesFetch();
      case 'databases':
        return this.props.databasesFetch(props.params.env);
      default:
        return this.props.configFetch(apiUrl);
    }
  }

  handleChange = ({ target }) => {
    let value = target.type === 'number' && target.value !== '' ? toNumber(target.value) : target.value;
    let name = target.name;

    if (this.props.params.slug === 'security') {
      // the only case where the input doesn't have a name
      if (target.name === '') {
        name = 'security.xframe.value.nested';
        value = target.value;
      }
    }
    this.props.changeInput(name, value);
  }

  handleChangeLanguage = (value) => this.props.changeInput('language.defaultLocale', value.value);

  handleCancel = () => this.props.cancelChanges();

  handleSubmit = (e) => { // eslint-disable-line consistent-return
    e.preventDefault();
    const apiUrl = this.props.params.env ? `${this.props.params.slug}/${this.props.params.env}` : this.props.params.slug;

    // send only updated settings
    const body = this.sendUpdatedParams();
    const formErrors = checkFormValidity(body, this.props.home.formValidations);

    if (isEmpty(body)) return window.Strapi.notification.info('{ id: strapi.notification.info.settingsEqual }');
    if (isEmpty(formErrors)) {
      this.props.editSettings(body, apiUrl);
    } else {
      this.props.setErrors(formErrors);
      // window.Strapi.notification.info('Settings are equals');
    }
  }

  handleSubmitEditDatabase = (databaseName) => { // eslint-disable-line consistent-return
    const body = this.sendUpdatedParams();
    const apiUrl = `${databaseName}/${this.props.params.env}`;
    const formErrors = checkFormValidity(body, this.props.home.formValidations);
    if (isEmpty(body)) return window.Strapi.notification.info('{ id: strapi.notification.info.settingsEqual }');

    if (isEmpty(formErrors)) {
      this.props.databaseEdit(body, apiUrl);
    } else {
      this.props.setErrors(formErrors);
    }
  }

  // retrieve the language to delete using the target id
  handleLanguageDelete = (languaToDelete) => this.props.languageDelete(languaToDelete);

  handleDatabaseDelete = (dbName) => {
    window.Strapi.notification.success('{ id: strapi.notification.success.databaseDelete}');
    this.props.databaseDelete(dbName, this.props.params.env);
  }

  // function used for react-select option
  optionComponent = (props) => <SelectOptionLanguage {...props} />;

  // custom Row rendering for the component List with params slug === languages
  renderRowLanguage = (props, key, liStyles) => (
    <RowLanguage
      key={key}
      {...props}
      liStyles={liStyles}
      handleLanguageDelete={this.handleLanguageDelete}
      listLanguages={this.props.home.listLanguages}
      changeDefaultLanguage={this.changeDefaultLanguage}
    />
  )

  renderListTitle = () => {
    const availableContentNumber = this.props.home.configsDisplay.sections.length;
    const title = availableContentNumber > 1 ? `list.${this.props.params.slug}.title.plural` : `list.${this.props.params.slug}.title.singular`;
    const titleDisplay = title ? <FormattedMessage {...{id: title}} /> : '';
    return <span>{availableContentNumber}&nbsp;{titleDisplay}</span>
  }

  renderListButtonLabel = () => `list.${this.props.params.slug}.button.label`;

  renderPopUpFormDatabase = (section, props, popUpStyles) => (
    map(section.items, (item, key) => {
      const isActive = props.values[this.props.home.dbNameTarget] === this.props.home.modifiedData['database.defaultConnection'] ?
        <div className={popUpStyles.rounded}><i className="fa fa-check" /></div> : '';

      if (item.name === 'form.database.item.default') {
        return (
          <div
            key={key}
            className={popUpStyles.defaultConnection}
            id={item.target}
            onClick={this.setDefaultConnectionDb}
          >
            <FormattedMessage {...{id: item.name}} />{isActive}
          </div>
        );
      }
      return (
        props.renderInput(item, key)
      );
    })
  )

  renderPopUpFormLanguage = (section) => (
    map(section.items, (item) => {
      const value = this.props.home.modifiedData[item.target] || this.props.home.selectOptions.options[0].value;

      return (
        <div className={`col-md-6`}>
          <div className={styles.modalLanguageLabel}>
            <FormattedMessage {...{id: item.name}} />
          </div>
          <Select
            name={item.target}
            value={value}
            options={this.props.home.selectOptions.options}
            onChange={this.handleChangeLanguage}
            valueComponent={this.valueComponent}
            optionComponent={this.optionComponent}
            clearable={false}

          />
          <div className={styles.popUpSpacer} />
        </div>
      )
    })
  )

  renderRowDatabase = (props, key) => (
    <RowDatabase
      key={key}
      data={props}
      getDatabase={this.getDatabase}
      handleDatabaseDelete={this.handleDatabaseDelete}
      sections={this.props.home.specificDatabase.sections}
      values={this.props.home.modifiedData}
      handleChange={this.handleChange}
      renderPopUpForm={this.renderPopUpFormDatabase}
      handleSubmit={this.handleSubmitEditDatabase}
      formErrors={this.props.home.formErrors}
      error={this.props.home.error}
    />
  )

  emptyDbModifiedData = () => {
    this.setState({ toggleDefaultConnection: false });
    this.props.emptyDbModifiedData();
  }
  renderComponent = () => {
    // check if  settingName (params.slug) has a custom view display
    let specificComponent = findKey(this.customComponents, (value) => includes(value, this.props.params.slug));

    if (!specificComponent) {
      // Check if params env : render HeaderNav component
      specificComponent = !this.props.params.env ? 'defaultComponent' : 'defaultComponentWithEnvironments';
    }

    // if custom view display render specificComponent
    const Component = this.components[specificComponent];
    const addRequiredInputDesign = this.props.params.slug === 'databases';
    const listTitle = this.props.params.slug === 'languages' || 'databases' ? this.renderListTitle() : '';
    const listButtonLabel = this.props.params.slug === 'languages' || 'databases' ? this.renderListButtonLabel() : '';

    // check if HeaderNav component needs to render a form or a list
    const renderListComponent = this.props.params.slug === 'databases';

    let handleListPopUpSubmit;
    // sections is the props used by EditForm in case of list of table rendering we need to change its value
    let sections;
    let renderPopUpForm = false;
    let renderRow = false;
    let actionBeforeOpenPopUp;
    let addListTitleMarginTop;

    switch (this.props.params.slug) {
      case 'languages':
        sections = this.props.home.listLanguages.sections;

        // custom rendering for PopUpForm
        renderPopUpForm = this.renderPopUpFormLanguage;
        renderRow = this.renderRowLanguage;
        handleListPopUpSubmit = this.props.newLanguagePost;
        break;
      case 'databases':
        sections = this.props.home.addDatabaseSection.sections;
        renderPopUpForm = this.renderPopUpFormDatabase;
        handleListPopUpSubmit = this.addConnection;
        renderRow = this.renderRowDatabase;
        actionBeforeOpenPopUp = this.emptyDbModifiedData;
        addListTitleMarginTop = true;
        break;
      default:
        sections = this.props.home.configsDisplay.sections;
    }

    // custom selectOptions for languages
    const selectOptions = this.props.params.slug === 'languages' ? this.props.home.listLanguages : [];

    return (
      <Component
        sections={sections}
        listItems={this.props.home.configsDisplay.sections}
        values={this.props.home.modifiedData}
        handleChange={this.handleChange}
        handleCancel={this.handleCancel}
        handleSubmit={this.handleSubmit}
        links={this.props.environments}
        path={this.props.location.pathname}
        slug={this.props.params.slug}
        renderRow={renderRow}
        listTitle={listTitle}
        listButtonLabel={listButtonLabel}
        handlei18n
        handleListPopUpSubmit={handleListPopUpSubmit}
        selectOptions={selectOptions}
        renderPopUpForm={renderPopUpForm}
        renderListComponent={renderListComponent}
        cancelAction={this.props.home.cancelAction}
        actionBeforeOpenPopUp={actionBeforeOpenPopUp}
        addRequiredInputDesign={addRequiredInputDesign}
        addListTitleMarginTop={addListTitleMarginTop}
        formErrors={this.props.home.formErrors}
        error={this.props.home.error}
      />
    );
  }

  setDefaultConnectionDb = () => {
    const value = this.state.toggleDefaultConnection ?
      this.props.home.addDatabaseSection.sections[1].items[0].value
        : this.props.home.modifiedData[this.props.home.dbNameTarget];
    const target = { name: 'database.defaultConnection', value };
    this.handleChange({target});
    this.setState({ toggleDefaultConnection: !this.state.toggleDefaultConnection });
  }

  // Hide database modal
  toggle = () => this.setState({ modal: !this.state.modal });

  // function used for react-select
  valueComponent = (props) => {
    const flagName = formatLanguageLocale(props.value.value);
    const flag = getFlag(flagName);

    return (
      <span className={`${styles.flagContainer} flag-icon-background flag-icon-${flag}`}>
        <FormattedMessage {...{id: props.value.label}} className={styles.marginLeft} />
      </span>
    );
  }

  render() {
    if (this.props.home.loading) {
      return <div />;
    }

    return (
      <div className={`${styles.home} col-md-9`}>
        <Helmet
          title="Settings Manager"
          meta={[
            { name: 'Settings Manager Plugin', content: 'Modify your app settings' },
          ]}
        />
        <ContentHeader
          name={this.props.home.configsDisplay.name}
          description={this.props.home.configsDisplay.description}
        />

        {this.renderComponent()}
      </div>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  environments: makeSelectEnvironments(),
  home: selectHomePage(),
  menuSections: makeSelectSections(),
})

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      cancelChanges,
      changeDefaultLanguage,
      changeInput,
      configFetch,
      databaseDelete,
      databaseEdit,
      databasesFetch,
      editSettings,
      emptyDbModifiedData,
      languageDelete,
      languagesFetch,
      newDatabasePost,
      newLanguagePost,
      setErrors,
      specificDatabaseFetch,
    },
    dispatch
  )
}

HomePage.propTypes = {
  cancelChanges: React.PropTypes.func,
  changeDefaultLanguage: React.PropTypes.func,
  changeInput: React.PropTypes.func,
  configFetch: React.PropTypes.func.isRequired,
  databaseDelete: React.PropTypes.func,
  databaseEdit: React.PropTypes.func,
  databasesFetch: React.PropTypes.func,
  editSettings: React.PropTypes.func,
  emptyDbModifiedData: React.PropTypes.func,
  environments: React.PropTypes.array,
  home: React.PropTypes.object,
  languageDelete: React.PropTypes.func,
  languagesFetch: React.PropTypes.func,
  location: React.PropTypes.object,
  menuSections: React.PropTypes.array,
  newDatabasePost: React.PropTypes.func,
  newLanguagePost: React.PropTypes.func,
  params: React.PropTypes.object.isRequired,
  setErrors: React.PropTypes.func,
  specificDatabaseFetch: React.PropTypes.func,
};

export default connect(mapStateToProps, mapDispatchToProps)(HomePage);