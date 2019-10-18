import axios from '../helpers/axios'

function Git() {
  this.branches = []
  this.status = []
}
Git.prototype.getBranches = async function(serviceLabel) {
  const {data: branches} = await axios.get('/git/'+serviceLabel+'/branches')
  this.branches = branches
  return this.branches
}
Git.prototype.getStatus = async function(serviceLabel) {
  const {data: status} = await axios.get('/git/'+serviceLabel+'/status')
  this.status = status
  return this.status
}

export default new Git()