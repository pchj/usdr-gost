import * as fetchApi from '@/helpers/fetchApi';

function initialState() {
  return {
    loggedInUser: null,
    settings: {
      selectedAgencyId: null,
    },
    users: [],
  };
}

export default {
  namespaced: true,
  state: initialState,
  getters: {
    loggedInUser: (state) => state.loggedInUser,
    currentTenant: (state, getters) => (getters.loggedInUser ? getters.loggedInUser.tenant : null),
    users: (state) => state.users,
    userRole: (state, getters) => (getters.loggedInUser ? getters.loggedInUser.role.name : null),
    agency: (state, getters) => (getters.loggedInUser ? getters.loggedInUser.agency : null),
    selectedAgencyId: (state, getters) => {
      if (state.settings.selectedAgencyId) {
        return state.settings.selectedAgencyId;
      }
      if (localStorage.getItem('selectedAgencyId')) {
        return localStorage.getItem('selectedAgencyId');
      }
      if (getters.loggedInUser) {
        return getters.loggedInUser.agency.id.toString();
      }
      return '';
    },
    selectedAgency: (state, getters) => {
      if (!getters.loggedInUser) {
        return null;
      }
      const agencyId = getters.selectedAgencyId;
      return getters.loggedInUser.agency.subagencies.find((a) => a.id.toString() === agencyId.toString());
    },
  },
  actions: {
    login({ dispatch, commit, getters }, user) {
      dispatch('changeSelectedAgency', getters.selectedAgencyId);
      commit('SET_LOGGED_IN_USER', user);
    },
    async logout({ commit }) {
      await fetchApi.get('/api/sessions/logout');
      commit('SET_LOGGED_IN_USER', null);
      localStorage.removeItem('selectedAgencyId');
    },
    async changeSelectedAgency({ commit }, agencyId) {
      commit('SET_SELECTED_AGENCY', agencyId);
      localStorage.setItem('selectedAgencyId', agencyId);
    },
    fetchUsers({ commit, rootGetters }) {
      return fetchApi.get(`/api/organizations/${rootGetters['users/selectedAgencyId']}/users`)
        .then((data) => commit('SET_USERS', data));
    },
    async createUser({ dispatch, rootGetters }, user) {
      await fetchApi.post(`/api/organizations/${rootGetters['users/selectedAgencyId']}/users`, user);
      await dispatch('fetchUsers');
    },
    async updateUser({ commit, rootGetters }, user) {
      const { id, name, avatarColor } = user;
      const data = await fetchApi.patch(`/api/organizations/${rootGetters['users/selectedAgencyId']}/users/${id}`, { name, avatar_color: avatarColor });
      commit('SET_LOGGED_IN_USER', data.user);
    },
    async deleteUser({ dispatch, commit, rootGetters }, userId) {
      try {
        await fetchApi.deleteRequest(
          `/api/organizations/${rootGetters['users/selectedAgencyId']}/users/${userId}`,
        );
      } catch (error) {
        commit('alerts/addAlert', {
          text: `Error deleting user: ${error.message}`,
          level: 'err',
        }, { root: true });
      }
      await dispatch('fetchUsers');
    },
    async updateEmailSubscriptionPreferencesForLoggedInUser({ commit, getters, rootGetters }, { preferences }) {
      const data = await fetchApi.put(
        `/api/organizations/${rootGetters['users/selectedAgencyId']}/users/${getters.loggedInUser.id}/email_subscription`,
        {
          preferences,
        },
      );
      commit('SET_LOGGED_IN_USER', data.user);
    },
  },
  mutations: {
    SET_LOGGED_IN_USER(state, user) {
      state.loggedInUser = user;
    },
    SET_USERS(state, users) {
      state.users = users;
    },
    SET_SELECTED_AGENCY(state, agencyId) {
      state.settings.selectedAgencyId = !Number.isNaN(agencyId) ? agencyId.toString() : agencyId;
    },
  },
};
